import { Link } from 'react-router-dom';
import { FileText, CheckCircle, MessageSquare, Plus, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentActivity } from '@/lib/performance-queries';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  data: RecentActivity[];
  isLoading: boolean;
}

export function RecentActivities({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Atividades Recentes</h3>
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

  const getActivityIcon = (type: RecentActivity['activityType']) => {
    switch (type) {
      case 'inspection_created':
        return <FileText className="h-4 w-4" />;
      case 'inspection_completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4" />;
      case 'activity_added':
        return <Plus className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: RecentActivity['activityType']) => {
    switch (type) {
      case 'inspection_created':
        return 'Nova Vistoria';
      case 'inspection_completed':
        return 'Concluída';
      case 'comment_added':
        return 'Comentário';
      case 'activity_added':
        return 'Atividade';
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground">Atividades Recentes</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {data.map((activity, index) => (
            <Link
              key={`${activity.activityType}-${activity.referenceId}-${index}`}
              to={`/vistoria/${activity.referenceId}`}
              className="block group"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {getActivityIcon(activity.activityType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {getActivityLabel(activity.activityType)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {activity.details}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {activity.userName}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))}

          {data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
