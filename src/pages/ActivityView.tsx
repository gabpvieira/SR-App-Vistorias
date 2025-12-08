import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Trash2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { PhotoGallery } from '@/components/PhotoGallery';
import { getActivityPhotos, deleteInspectionActivity } from '@/lib/supabase-queries';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
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

export default function ActivityView() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activity, setActivity] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadActivity() {
      if (!activityId) return;

      try {
        const { data: activityData } = await supabase
          .from('inspection_activities')
          .select('*')
          .eq('id', activityId)
          .single();

        setActivity(activityData);

        const photosData = await getActivityPhotos(activityId);
        setPhotos(photosData);
      } catch (error) {
        console.error('Erro ao carregar atividade:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivity();
  }, [activityId]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getVehicleModelLabel(model?: string) {
    const labels: Record<string, string> = {
      cavalo: 'Cavalo Mecânico',
      rodotrem_basculante: 'Rodotrem Basculante',
      rodotrem_graneleiro: 'Rodotrem Graneleiro',
      livre: 'Livre',
    };
    return labels[model || 'livre'] || 'Livre';
  }

  async function handleDelete() {
    if (!activityId || !activity) return;

    setIsDeleting(true);

    try {
      await deleteInspectionActivity(activityId);
      
      toast({
        title: 'Atividade deletada',
        description: 'A atividade e todas as suas fotos foram removidas com sucesso.',
      });

      navigate(`/inspection/${activity.inspection_id}`);
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar a atividade. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="container px-4 py-6">
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="container px-4 py-6">
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">Atividade não encontrada</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Detalhes da Atividade</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 py-6 max-w-4xl">
          <button
            onClick={() => navigate(`/inspection/${activity.inspection_id}`)}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Vistoria
          </button>

          {/* Header */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    activity.type === 'guiada' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {activity.type === 'guiada' ? 'Vistoria Guiada' : 'Vistoria Livre'}
                  </span>
                  {activity.type === 'guiada' && (
                    <span className="text-sm text-muted-foreground">
                      {getVehicleModelLabel(activity.vehicle_model)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Criada em {formatDate(activity.created_at)}
                </p>
              </div>
              
              {user && (user.id === activity.created_by || user.role === 'gerente') && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja deletar esta atividade?
                        Esta ação não pode ser desfeita e todas as {photos.length} foto(s) serão removidas permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deletando...
                          </>
                        ) : (
                          'Deletar Atividade'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Observações */}
          {activity.notes && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="font-semibold mb-3">Observações do Registro</h2>
              <p className="text-foreground whitespace-pre-wrap">{activity.notes}</p>
            </div>
          )}

          {/* Photos */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Camera className="h-5 w-5 text-muted-foreground" />
              Fotos ({photos.length})
            </h2>

            {photos.length > 0 ? (
              <PhotoGallery photos={photos.map(p => p.photo_url)} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma foto cadastrada</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
