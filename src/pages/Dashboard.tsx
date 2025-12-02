import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/Header';
import { InspectionCard } from '@/components/InspectionCard';
import { WelcomeGreeting } from '@/components/WelcomeGreeting';
import { useAuth } from '@/contexts/AuthContext';
import { useInspections } from '@/contexts/InspectionContext';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  const { getFilteredInspections, isLoading } = useInspections();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'troca' | 'manutencao'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sellers, setSellers] = useState<User[]>([]);

  const isManager = user?.role === 'gerente';

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

  const hasActiveFilters = typeFilter !== 'all' || periodFilter !== 'all' || userFilter !== 'all';

  const clearFilters = () => {
    setTypeFilter('all');
    setPeriodFilter('all');
    setUserFilter('all');
    setSearch('');
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - SR Caminhões</title>
        <meta name="description" content="Gerencie suas vistorias de veículos no sistema SR Caminhões." />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 py-6">
          <WelcomeGreeting />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">Minhas Vistorias</h1>
            
            <Button asChild className="hidden md:inline-flex">
              <Link to="/vistoria/nova">
                <Plus className="h-4 w-4 mr-2" />
                Nova Vistoria
              </Link>
            </Button>
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
                    {[typeFilter !== 'all', periodFilter !== 'all', userFilter !== 'all'].filter(Boolean).length}
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

                {isManager && (
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
                )}

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

                {isManager && (
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
                )}

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
        </main>
      </div>
    </>
  );
}
