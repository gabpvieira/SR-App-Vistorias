import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DistributionData } from '@/lib/performance-queries';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface Props {
  typeData: DistributionData[];
  statusData: DistributionData[];
  isLoading: boolean;
}

const TYPE_COLORS = {
  'Troca': '#3b82f6',
  'Manutenção': '#10b981',
};

const STATUS_COLORS = {
  'Rascunho': '#94a3b8',
  'Concluida': '#22c55e',
  'Aprovada': '#06b6d4',
  'Rejeitada': '#ef4444',
};

export function DistributionChart({ typeData, statusData, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Distribuição</h3>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground">Distribuição</h3>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="type" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="type" className="text-xs">Por Tipo</TabsTrigger>
            <TabsTrigger value="status" className="text-xs">Por Status</TabsTrigger>
          </TabsList>

          <TabsContent value="type" className="mt-0 space-y-6">
            {/* Bar Chart */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart 
                data={typeData}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                barSize={60}
              >
                <XAxis 
                  dataKey="type" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fill: 'hsl(var(--muted-foreground))', 
                    fontSize: 11,
                    fontWeight: 500
                  }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fill: 'hsl(var(--muted-foreground))', 
                    fontSize: 11,
                    fontWeight: 500
                  }}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                        <p className="text-xs font-medium text-foreground mb-1">
                          {payload[0].payload.type}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Total:</span>
                          <span className="text-sm font-semibold text-foreground">
                            {payload[0].payload.count} ({payload[0].payload.percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[6, 6, 0, 0]}
                >
                  {typeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={TYPE_COLORS[entry.type as keyof typeof TYPE_COLORS] || '#94a3b8'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Stats List */}
            <div className="space-y-2">
              {typeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1 h-8 rounded-full" 
                      style={{ backgroundColor: TYPE_COLORS[item.type as keyof typeof TYPE_COLORS] }}
                    />
                    <span className="text-sm font-medium text-foreground">{item.type}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="status" className="mt-0 space-y-6">
            {/* Bar Chart */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart 
                data={statusData}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                barSize={40}
              >
                <XAxis 
                  dataKey="type" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fill: 'hsl(var(--muted-foreground))', 
                    fontSize: 11,
                    fontWeight: 500
                  }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fill: 'hsl(var(--muted-foreground))', 
                    fontSize: 11,
                    fontWeight: 500
                  }}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                        <p className="text-xs font-medium text-foreground mb-1">
                          {payload[0].payload.type}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Total:</span>
                          <span className="text-sm font-semibold text-foreground">
                            {payload[0].payload.count} ({payload[0].payload.percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[6, 6, 0, 0]}
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.type as keyof typeof STATUS_COLORS] || '#94a3b8'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Stats List */}
            <div className="space-y-2">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1 h-8 rounded-full" 
                      style={{ backgroundColor: STATUS_COLORS[item.type as keyof typeof STATUS_COLORS] }}
                    />
                    <span className="text-sm font-medium text-foreground">{item.type}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
