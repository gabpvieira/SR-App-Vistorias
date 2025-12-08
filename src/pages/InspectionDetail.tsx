import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, FileText, Camera, Download, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { InspectionTypeBadge } from '@/components/InspectionTypeBadge';
import { PhotoGallery } from '@/components/PhotoGallery';
import { InspectionActivities } from '@/components/InspectionActivities';
import { InspectionComments } from '@/components/InspectionComments';
import { formatDateTime } from '@/lib/date-utils';
import { useAuth } from '@/contexts/AuthContext';
import { useInspections } from '@/contexts/InspectionContext';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { getInspectionById, getPhotosByInspectionId } from '@/lib/supabase-queries';
import { Inspection, InspectionPhoto } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
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

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { deleteInspection } = useInspections();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadInspection() {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        const inspectionData = await getInspectionById(id);
        
        setInspection(inspectionData);

        // Load photos
        const photosData = await getPhotosByInspectionId(id);
        setPhotos(photosData);

        // Load user name
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', inspectionData.user_id)
          .single();
        if (userData) setUserName(userData.name);

      } catch (error) {
        console.error('Erro ao carregar vistoria:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadInspection();
  }, [id, user]);

  const handleDelete = async () => {
    if (!id || !inspection) return;

    setIsDeleting(true);

    try {
      await deleteInspection(id);
      
      toast({
        title: 'Vistoria deletada',
        description: `Vistoria ${inspection.vehicle_plate} foi removida com sucesso.`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao deletar vistoria:', error);
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar a vistoria. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!photos.length) return;

    for (let i = 0; i < photos.length; i++) {
      try {
        const response = await fetch(photos[i].photo_url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${inspection?.vehicle_plate || 'vistoria'}-foto-${i + 1}.jpg`;
        link.click();
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Erro ao baixar foto:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="container px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando vistoria...</p>
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !inspection) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="container px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">Vistoria não encontrada</p>
            <Button asChild>
              <Link to="/dashboard">Voltar para Dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Detalhes</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>

          {/* Header */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vistoria #{inspection.id.substring(0, 8)}</p>
                <h1 className="text-3xl font-bold text-foreground">{inspection.vehicle_plate || 'Sem placa'}</h1>
              </div>
              <div className="flex items-center gap-3">
                <InspectionTypeBadge type={inspection.type} />
                {user?.role === 'gerente' && (
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
                          Tem certeza que deseja deletar a vistoria da placa <strong>{inspection.vehicle_plate}</strong>?
                          Esta ação não pode ser desfeita e todas as fotos serão removidas.
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
                            'Deletar Vistoria'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Informações
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">{formatDateTime(inspection.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Cadastrado por</p>
                  <p className="font-medium">{userName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium uppercase">{inspection.vehicle_model_name || 'Não informado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Ano / Status</p>
                  <p className="font-medium">
                    {inspection.vehicle_year && inspection.vehicle_model_year 
                      ? `${inspection.vehicle_year}/${inspection.vehicle_model_year}`
                      : inspection.vehicle_year || 'Não informado'
                    } • {inspection.vehicle_status === 'novo' ? 'Novo' : 'Seminovo'}
                  </p>
                </div>
              </div>
            </div>

            {inspection.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-foreground">{inspection.notes}</p>
              </div>
            )}
          </div>

          {/* Photos Card */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-muted-foreground" />
                Fotos ({photos.length})
              </h2>

              {photos.length > 1 && (
                <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Todas
                </Button>
              )}
            </div>

            {photos.length > 0 ? (
              <PhotoGallery photos={photos.map(p => p.photo_url)} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma foto cadastrada</p>
              </div>
            )}
          </div>

          {/* Activities Section */}
          <div className="mb-6 animate-fade-in">
            <InspectionActivities inspectionId={inspection.id} />
          </div>

          {/* Comments Section */}
          <div className="animate-fade-in">
            <InspectionComments inspectionId={inspection.id} />
          </div>
        </main>
      </div>
    </>
  );
}
