import { TrendingUp, TrendingDown, FileText, Calendar, CheckCircle, Image, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PerformanceKPIs as KPIData } from '@/lib/performance-queries';

interface Props {
  data: KPIData | null;
  isLoading: boolean;
}

export function PerformanceKPIs({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total de Vistorias',
      value: data.totalInspections,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Vistorias no Mês',
      value: data.thisMonthInspections,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: data.monthGrowth,
    },
    {
      label: 'Média Diária',
      value: data.dailyAverage.toFixed(1),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      suffix: ' vistorias',
    },
    {
      label: 'Taxa de Conclusão',
      value: `${data.completionRate}%`,
      icon: CheckCircle,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
  ];

  const allKpis = [
    ...kpis,
    {
      label: 'Total de Fotos',
      value: data.totalPhotos,
      icon: Image,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Total de Comentários',
      value: data.totalComments,
      icon: MessageSquare,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {allKpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:border-primary/20 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col items-center text-center space-y-3">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Label */}
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {kpi.label}
                  </p>

                  {/* Value */}
                  <div className="flex items-baseline justify-center gap-1">
                    <p className="text-3xl font-bold text-foreground leading-none">
                      {kpi.value}
                    </p>
                    {kpi.suffix && (
                      <span className="text-xs text-muted-foreground leading-none">{kpi.suffix}</span>
                    )}
                  </div>

                  {/* Trend */}
                  {kpi.trend !== undefined ? (
                    <div className="flex items-center justify-center gap-1.5">
                      {kpi.trend >= 0 ? (
                        <>
                          <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">
                            +{kpi.trend.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">
                            {kpi.trend.toFixed(1)}%
                          </span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground/70">vs mês anterior</span>
                    </div>
                  ) : (
                    <div className="h-5" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile Layout - 2x3 Grid */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {allKpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:border-primary/20 transition-colors">
              <CardContent className="p-3">
                <div className="flex flex-col items-center gap-2">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Label */}
                  <p className="text-xs text-center text-muted-foreground font-medium line-clamp-2 leading-tight px-1">
                    {kpi.label}
                  </p>

                  {/* Value */}
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <p className="text-2xl font-bold text-foreground leading-none">
                      {kpi.value}
                    </p>
                    {kpi.suffix && (
                      <span className="text-xs text-muted-foreground leading-none">{kpi.suffix}</span>
                    )}
                  </div>

                  {/* Trend */}
                  {kpi.trend !== undefined ? (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {kpi.trend >= 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">
                            +{kpi.trend.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">
                            {kpi.trend.toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-4" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
