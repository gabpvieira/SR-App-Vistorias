import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InspectionByDate } from '@/lib/performance-queries';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  data: InspectionByDate[];
  isLoading: boolean;
}

export function InspectionChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Vistorias ao Longo do Tempo</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'dd/MM', { locale: ptBR }),
    fullDate: format(new Date(item.date), 'dd MMM yyyy', { locale: ptBR }),
    total: item.count,
    troca: item.trocaCount,
    manutencao: item.manutencaoCount,
  }));

  // Calculate max value for better scaling
  const maxValue = Math.max(...chartData.map(d => d.total));
  const yAxisMax = Math.ceil(maxValue * 1.2);

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Vistorias ao Longo do Tempo</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-foreground rounded-full" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500 rounded-full" />
              <span className="text-xs text-muted-foreground">Troca</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500 rounded-full" />
              <span className="text-xs text-muted-foreground">Manutenção</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280} className="sm:h-80">
          <LineChart 
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.8} />
                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="0" 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.3}
              vertical={false}
            />
            
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: 'hsl(var(--muted-foreground))', 
                fontSize: 11,
                fontWeight: 500
              }}
              dy={10}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: 'hsl(var(--muted-foreground))', 
                fontSize: 11,
                fontWeight: 500
              }}
              domain={[0, yAxisMax]}
              allowDecimals={false}
            />
            
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                
                return (
                  <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                    <p className="text-xs font-medium text-foreground mb-2">
                      {payload[0].payload.fullDate}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-xs font-semibold text-foreground">
                          {payload[0].payload.total}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Troca</span>
                        <span className="text-xs font-semibold text-blue-500">
                          {payload[0].payload.troca}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Manutenção</span>
                        <span className="text-xs font-semibold text-green-500">
                          {payload[0].payload.manutencao}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            
            {/* Main line - Total */}
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="url(#lineGradient)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: 'hsl(var(--foreground))',
                strokeWidth: 2,
                stroke: 'hsl(var(--background))'
              }}
            />
            
            {/* Secondary lines */}
            <Line 
              type="monotone" 
              dataKey="troca" 
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3, fill: '#3b82f6' }}
            />
            
            <Line 
              type="monotone" 
              dataKey="manutencao" 
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
