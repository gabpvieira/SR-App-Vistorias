import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, X, FileText, BarChart3, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { InspectionCard } from '@/components/InspectionCard';
import { WelcomeGreeting } from '@/components/WelcomeGreeting';
import { useAuth } from '@/contexts/AuthContext';
import { useInspections } from '@/contexts/InspectionContext';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/supabase';

// Import Performance components
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { PerformanceKPIs } from '@/components/performance/PerformanceKPIs';
import { UserRanking } from '@/components/performance/UserRanking';
import { InspectionChart } from '@/components/performance/InspectionChart';
import { DistributionChart } from '@/components/performance/DistributionChart';
import { RecentActivities } from '@/components/performance/RecentActivities';

// Import User Management components
import { getAllUsers, deactivateUser, activateUser } from '@/lib/supabase-queries';
import { formatDateTime } from '@/lib/date-utils';
import { UserX, UserCheck, Mail, User as UserIcon, Shield, Calendar } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const { getFilteredInspections, isLoading, refreshInspections } = useInspections();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'troca' | 'manutencao'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sellers, setSellers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('vistorias');
  const [vendorTab, setVendorTab] = useState<'all' | 'mine'>('all');

  const isManager = user?.role === 'gerente';

  // Performance data
  const [performancePeriod, setPerformancePeriod] = useState<number>(30);
  const {
    kpis,
    userRanking,
    inspectionsByDate,
    typeDistribution,
    statusDistribution,
    recentActivities,
    isLoading: isLoadingPerformance,
    error: performanceError,
  } = usePerformanceData(performancePeriod);

  // User management
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSellers() {
      if (isManager) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'vendedor');
        if (data) setSellers(data);
      }
    }
    loadSellers();
  }, [isManager]);

  useEffect(() => {
    if (isManager && activeTab === 'usuarios') {
      loadUsers();
    }
  }, [isManager, activeTab]);

  // Recarregar vistorias quando o componente é montado
  useEffect(() => {
    refreshInspections();
  }, [refreshInspections]);

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleToggleUserStatus(userId: string, userName: string, currentStatus: boolean) {
    if (userId === user?.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode desativar sua própria conta',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingId(userId);
      
      if (currentStatus) {
        // Desativar usuário
        await deactivateUser(userId);
        toast({
          title: 'Usuário desativado',
          description: `${userName} foi desativado. O histórico de vistorias foi preservado.`,
        });
      } else {
        // Ativar usuário
        await activateUser(userId);
        toast({
          title: 'Usuário reativado',
          description: `${userName} foi reativado e pode acessar o sistema novamente.`,
        });
      }
      
      await loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do usuário',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  }

  const inspections = useMemo(() => {
    // Vendedores só veem suas próprias vistorias
    const effectiveUserFilter = isManager 
      ? (userFilter === 'all' ? undefined : userFilter)
      : user?.id;

    return getFilteredInspections({
      search,
      type: typeFilter,
      period: periodFilter,
      userId: effectiveUserFilter,
    });
  }, [getFilteredInspections, search, typeFilter, periodFilter, userFilter, isManager, user?.id]);

  const hasActiveFilters = useMemo(() => 
    typeFilter !== 'all' || periodFilter !== 'all' || userFilter !== 'all',
    [typeFilter, periodFilter, userFilter]
  );

  const clearFilters = () => {
    setTypeFilter('all');
    setPeriodFilter('all');
    setUserFilter('all');
    setSearch('');
  };

  // Filtrar vistorias para vendedores baseado na aba selecionada
  const vendorInspections = useMemo(() => {
    if (isManager) return [];
    
    const effectiveUserFilter = vendorTab === 'mine' ? user?.id : undefined;

    return getFilteredInspections({
      search,
      type: typeFilter,
      period: periodFilter,
      userId: effectiveUserFilter,
    });
  }, [isManager, getFilteredInspections, search, typeFilter, periodFilter, vendorTab, user?.id]);

  // Render for non-managers (vendedores)
  if (!isManager) {

    return (
      <>
        <Helmet>
          <title>Painel</title>
          <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        </Helmet>

        <div className="min-h-screen bg-secondary">
          <Header />

          <main className="container px-4 sm:px-6 lg:px-8 py-6">
            <WelcomeGreeting />

            {/* Desktop Tabs */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between mb-6">
                <Tabs value={vendorTab} onValueChange={(v) => setVendorTab(v as 'all' | 'mine')}>
                  <TabsList className="grid w-auto grid-cols-2">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="mine">Minhas Vistorias</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Button asChild>
                  <Link to="/vistoria/nova">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Vistoria
                  </Link>
                </Button>
              </div>
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-foreground">Vistorias</h1>
                
                <Button asChild size="sm">
                  <Link to="/vistoria/nova">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVendorTab('all')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    vendorTab === 'all'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  <span className="text-sm font-medium">Todos</span>
                </button>

                <button
                  onClick={() => setVendorTab('mine')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    vendorTab === 'mine'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  <span className="text-sm font-medium">Minhas Vistorias</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por placa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                      {[typeFilter !== 'all', periodFilter !== 'all'].filter(Boolean).length}
                    </span>
                  )}
                </Button>

                {/* Desktop filters */}
                <div className="hidden sm:flex gap-3">
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="troca">Troca</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo período</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>

              {/* Mobile filters (collapsible) */}
              {showFilters && (
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border sm:hidden">
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="troca">Troca</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo período</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground">Carregando vistorias...</p>
              </div>
            ) : vendorInspections.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground mb-4">Nenhuma vistoria encontrada</p>
                <Button asChild>
                  <Link to="/vistoria/nova">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira vistoria
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {vendorInspections.length} vistoria{vendorInspections.length !== 1 ? 's' : ''} encontrada{vendorInspections.length !== 1 ? 's' : ''}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {vendorInspections.map((inspection) => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </>
    );
  }

  // Render for managers with tabs
  return (
    <>
      <Helmet>
        <title>Painel Administrativo</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 sm:px-6 lg:px-8 py-6">
          <WelcomeGreeting />

          {/* Tabs for Desktop - Hidden on Mobile */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-auto grid-cols-3">
                <TabsTrigger value="vistorias" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Vistorias
                </TabsTrigger>
                <TabsTrigger value="desempenho" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Desempenho
                </TabsTrigger>
                <TabsTrigger value="usuarios" className="gap-2">
                  <UsersIcon className="h-4 w-4" />
                  Usuários
                </TabsTrigger>
              </TabsList>

              {activeTab === 'vistorias' && (
                <Button asChild>
                  <Link to="/vistoria/nova">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Vistoria
                  </Link>
                </Button>
              )}

              {activeTab === 'usuarios' && (
                <Button asChild>
                  <Link to="/usuarios/novo">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Link>
                </Button>
              )}
            </div>

            {/* Vistorias Tab */}
            <TabsContent value="vistorias" className="mt-0">

              {/* Search and Filters */}
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por placa..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Desktop filters */}
                  <div className="flex gap-3">
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="troca">Troca</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todo período</SelectItem>
                        <SelectItem value="week">Última semana</SelectItem>
                        <SelectItem value="month">Último mês</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os vendedores</SelectItem>
                        {sellers.map(seller => (
                          <SelectItem key={seller.id} value={seller.id}>
                            {seller.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results */}
              {isLoading ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <p className="text-muted-foreground">Carregando vistorias...</p>
                </div>
              ) : inspections.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <p className="text-muted-foreground mb-4">Nenhuma vistoria encontrada</p>
                  <Button asChild>
                    <Link to="/vistoria/nova">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeira vistoria
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {inspections.length} vistoria{inspections.length !== 1 ? 's' : ''} encontrada{inspections.length !== 1 ? 's' : ''}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {inspections.map((inspection) => (
                      <InspectionCard key={inspection.id} inspection={inspection} />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Desempenho Tab */}
            <TabsContent value="desempenho" className="mt-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Painel de Desempenho</h2>
                  <p className="text-sm text-muted-foreground">Métricas e estatísticas da equipe</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Select value={performancePeriod.toString()} onValueChange={(v) => setPerformancePeriod(Number(v))}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Última semana</SelectItem>
                      <SelectItem value="30">Último mês</SelectItem>
                      <SelectItem value="90">Últimos 3 meses</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {performanceError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-destructive">
                    Erro ao carregar dados: {performanceError.message}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <PerformanceKPIs data={kpis} isLoading={isLoadingPerformance} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InspectionChart data={inspectionsByDate} isLoading={isLoadingPerformance} />
                  <DistributionChart 
                    typeData={typeDistribution} 
                    statusData={statusDistribution}
                    isLoading={isLoadingPerformance} 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UserRanking data={userRanking} isLoading={isLoadingPerformance} />
                  <RecentActivities data={recentActivities} isLoading={isLoadingPerformance} />
                </div>
              </div>
            </TabsContent>

            {/* Usuários Tab */}
            <TabsContent value="usuarios" className="mt-0">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>
                <p className="text-sm text-muted-foreground">Adicione, edite ou remova usuários do sistema</p>
              </div>

              {loadingUsers ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <p className="text-muted-foreground">Carregando usuários...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <p className="text-muted-foreground mb-4">Nenhum usuário cadastrado</p>
                  <Button asChild>
                    <Link to="/usuarios/novo">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar primeiro usuário
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Nome</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">E-mail</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Cargo</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Status</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Criado em</th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <UserIcon className="h-5 w-5 text-primary" />
                                </div>
                                <p className="font-medium text-foreground">{u.name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">{u.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className={`text-sm font-medium ${
                                  u.role === 'gerente' ? 'text-primary' : 'text-muted-foreground'
                                }`}>
                                  {u.role === 'gerente' ? 'Administrador' : 'Vendedor'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                u.is_active 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {u.is_active ? (
                                  <>
                                    <UserCheck className="h-3 w-3" />
                                    Ativo
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3 w-3" />
                                    Inativo
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">{formatDateTime(u.created_at)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant={u.is_active ? "ghost" : "outline"}
                                    size="sm"
                                    disabled={processingId === u.id || u.id === user?.id}
                                  >
                                    {u.is_active ? (
                                      <UserX className="h-4 w-4 text-destructive" />
                                    ) : (
                                      <UserCheck className="h-4 w-4 text-green-600" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {u.is_active ? 'Desativar usuário' : 'Reativar usuário'}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {u.is_active ? (
                                        <>
                                          Tem certeza que deseja desativar <strong>{u.name}</strong>?
                                          O usuário não poderá mais acessar o sistema, mas todo o histórico de vistorias será preservado.
                                        </>
                                      ) : (
                                        <>
                                          Tem certeza que deseja reativar <strong>{u.name}</strong>?
                                          O usuário poderá acessar o sistema novamente.
                                        </>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleToggleUserStatus(u.id, u.name, u.is_active)}
                                      className={u.is_active 
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                      }
                                    >
                                      {u.is_active ? 'Desativar' : 'Reativar'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Mobile View - Show tabs as buttons */}
          <div className="md:hidden space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
              
              {activeTab === 'vistorias' && (
                <Button asChild size="sm">
                  <Link to="/vistoria/nova">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              {activeTab === 'usuarios' && (
                <Button asChild size="sm">
                  <Link to="/usuarios/novo">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab('vistorias')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                  activeTab === 'vistorias'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:bg-muted/50'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs font-medium">Vistorias</span>
              </button>

              <button
                onClick={() => setActiveTab('desempenho')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                  activeTab === 'desempenho'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:bg-muted/50'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs font-medium">Desempenho</span>
              </button>

              <button
                onClick={() => setActiveTab('usuarios')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                  activeTab === 'usuarios'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:bg-muted/50'
                }`}
              >
                <UsersIcon className="h-5 w-5" />
                <span className="text-xs font-medium">Usuários</span>
              </button>
            </div>

            {/* Mobile Content */}
            <div className="mt-6">
              {activeTab === 'vistorias' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por placa..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          <SelectItem value="troca">Troca</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todo período</SelectItem>
                          <SelectItem value="week">Última semana</SelectItem>
                          <SelectItem value="month">Último mês</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vendedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os vendedores</SelectItem>
                          {sellers.map(seller => (
                            <SelectItem key={seller.id} value={seller.id}>
                              {seller.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Limpar filtros
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Results */}
                  {isLoading ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                      <p className="text-muted-foreground">Carregando vistorias...</p>
                    </div>
                  ) : inspections.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                      <p className="text-muted-foreground mb-4">Nenhuma vistoria encontrada</p>
                      <Button asChild>
                        <Link to="/vistoria/nova">
                          <Plus className="h-4 w-4 mr-2" />
                          Criar primeira vistoria
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        {inspections.length} vistoria{inspections.length !== 1 ? 's' : ''} encontrada{inspections.length !== 1 ? 's' : ''}
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {inspections.map((inspection) => (
                          <InspectionCard key={inspection.id} inspection={inspection} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'desempenho' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Desempenho</h2>
                      <p className="text-sm text-muted-foreground">Métricas da equipe</p>
                    </div>
                    <Select value={performancePeriod.toString()} onValueChange={(v) => setPerformancePeriod(Number(v))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {performanceError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <p className="text-sm text-destructive">
                        Erro ao carregar dados: {performanceError.message}
                      </p>
                    </div>
                  )}

                  <PerformanceKPIs data={kpis} isLoading={isLoadingPerformance} />
                  <InspectionChart data={inspectionsByDate} isLoading={isLoadingPerformance} />
                  <DistributionChart 
                    typeData={typeDistribution} 
                    statusData={statusDistribution}
                    isLoading={isLoadingPerformance} 
                  />
                  <UserRanking data={userRanking} isLoading={isLoadingPerformance} />
                  <RecentActivities data={recentActivities} isLoading={isLoadingPerformance} />
                </div>
              )}

              {activeTab === 'usuarios' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">Usuários</h2>
                    <p className="text-sm text-muted-foreground">Gerenciar usuários</p>
                  </div>

                  {loadingUsers ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                      <p className="text-muted-foreground">Carregando usuários...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                      <p className="text-muted-foreground mb-4">Nenhum usuário cadastrado</p>
                      <Button asChild>
                        <Link to="/usuarios/novo">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar primeiro usuário
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {users.map((u) => (
                        <div key={u.id} className="bg-card border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-5 w-5 text-primary" />
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-foreground truncate">{u.name}</p>
                                {u.role === 'gerente' && (
                                  <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                u.is_active 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {u.is_active ? (
                                  <>
                                    <UserCheck className="h-3 w-3" />
                                    Ativo
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3 w-3" />
                                    Inativo
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Toggle Status Button */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant={u.is_active ? "ghost" : "outline"}
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  disabled={processingId === u.id || u.id === user?.id}
                                >
                                  {u.is_active ? (
                                    <UserX className="h-4 w-4 text-destructive" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {u.is_active ? 'Desativar usuário' : 'Reativar usuário'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.is_active ? (
                                      <>
                                        Tem certeza que deseja desativar <strong>{u.name}</strong>?
                                        O histórico de vistorias será preservado.
                                      </>
                                    ) : (
                                      <>
                                        Tem certeza que deseja reativar <strong>{u.name}</strong>?
                                      </>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel className="m-0">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleToggleUserStatus(u.id, u.name, u.is_active)}
                                    className={`m-0 ${u.is_active 
                                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      : "bg-green-600 text-white hover:bg-green-700"
                                    }`}
                                  >
                                    {u.is_active ? 'Desativar' : 'Reativar'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
