import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Calendar } from 'lucide-react';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { PerformanceKPIs } from '@/components/performance/PerformanceKPIs';
import { UserRanking } from '@/components/performance/UserRanking';
import { InspectionChart } from '@/components/performance/InspectionChart';
import { DistributionChart } from '@/components/performance/DistributionChart';
import { RecentActivities } from '@/components/performance/RecentActivities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Performance() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<number>(30);
  
  const {
    kpis,
    userRanking,
    inspectionsByDate,
    typeDistribution,
    statusDistribution,
    recentActivities,
    isLoading,
    error,
  } = usePerformanceData(period);

  // Redirect if not manager
  if (!user || user.role !== 'gerente') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Painel de Desempenho</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Painel de Desempenho</h1>
                <p className="text-sm text-muted-foreground">
                  Métricas e estatísticas da equipe
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={period.toString()} onValueChange={(v) => setPeriod(Number(v))}>
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

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-destructive">
                Erro ao carregar dados: {error.message}
              </p>
            </div>
          )}

          {/* KPIs */}
          <div className="mb-6">
            <PerformanceKPIs data={kpis} isLoading={isLoading} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <InspectionChart data={inspectionsByDate} isLoading={isLoading} />
            <DistributionChart 
              typeData={typeDistribution} 
              statusData={statusDistribution}
              isLoading={isLoading} 
            />
          </div>

          {/* Ranking and Activities Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserRanking data={userRanking} isLoading={isLoading} />
            <RecentActivities data={recentActivities} isLoading={isLoading} />
          </div>
        </main>
      </div>
    </>
  );
}
