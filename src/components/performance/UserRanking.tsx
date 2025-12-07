import { useState } from 'react';
import { Trophy, Medal, Award, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserRanking as UserRankingData } from '@/lib/performance-queries';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  data: UserRankingData[];
  isLoading: boolean;
}

type SortField = 'totalInspections' | 'monthInspections' | 'completionRate';

export function UserRanking({ data, isLoading }: Props) {
  const [sortField, setSortField] = useState<SortField>('totalInspections');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Ranking de Vendedores</h3>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (a[sortField] - b[sortField]) * multiplier;
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground">Ranking de Vendedores</h3>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Rank
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Vendedor
                </th>
                <th 
                  className="text-center py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('totalInspections')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Total
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="text-center py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('monthInspections')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Mês
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="text-center py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('completionRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Taxa
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Última Vistoria
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((user, index) => (
                <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center">
                      {getRankIcon(index)}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge variant="secondary" className="font-semibold">
                      {user.totalInspections}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge variant="outline" className="font-semibold">
                      {user.monthInspections}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`font-semibold ${
                      user.completionRate >= 80 ? 'text-green-600' :
                      user.completionRate >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {user.completionRate}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-muted-foreground hidden md:table-cell">
                    {user.lastInspection ? (
                      formatDistanceToNow(new Date(user.lastInspection), {
                        addSuffix: true,
                        locale: ptBR,
                      })
                    ) : (
                      'Nenhuma'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum vendedor encontrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
