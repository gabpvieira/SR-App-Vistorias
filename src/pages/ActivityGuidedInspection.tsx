import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Progress } from '@/components/ui/progress';
import { getStepsByVehicleModel, uploadAndSaveActivityPhoto } from '@/lib/supabase-queries';
import { supabase } from '@/lib/supabase';
import { InspectionStepTemplate, VehicleModel } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';

interface CapturedPhoto {
  stepId: string;
  file: File;
  previewUrl: string;
}

export default function ActivityGuidedInspection() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activity, setActivity] = useState<any>(null);
  const [steps, setSteps] = useState<InspectionStepTemplate[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [photos, setPhotos] = useState<Map<string, CapturedPhoto>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    async function loadActivity() {
      if (!activityId) return;

      try {
        const { data: activityData } = await supabase
          .from('inspection_activities')
          .select('*')
          .eq('id', activityId)
          .single();

        if (!activityData || !activityData.vehicle_model || activityData.vehicle_model === 'livre') {
          navigate(-1);
          return;
        }

        setActivity(activityData);

        const stepsData = await getStepsByVehicleModel(activityData.vehicle_model as Exclude<VehicleModel, 'livre'>);
        setSteps(stepsData);
      } catch (error) {
        console.error('Erro ao carregar atividade:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a atividade.',
          variant: 'destructive',
        });
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivity();
  }, [activityId, navigate, toast]);

  const currentStep = steps[currentStepIndex];
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const currentPhoto = currentStep ? photos.get(currentStep.id) : null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentStep) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const newPhotos = new Map(photos);
    newPhotos.set(currentStep.id, {
      stepId: currentStep.id,
      file,
      previewUrl,
    });
    setPhotos(newPhotos);
  };

  const handleNext = () => {
    if (!currentPhoto && currentStep?.is_required) {
      toast({
        title: 'Foto obrigatória',
        description: 'Por favor, capture uma foto antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (isLastStep) {
      handleFinalize();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleFinalize = async () => {
    if (!activityId || !activity) return;

    setIsFinalizing(true);

    try {
      // Upload todas as fotos
      for (const [stepId, photo] of photos.entries()) {
        const step = steps.find(s => s.id === stepId);
        if (!step) continue;

        await uploadAndSaveActivityPhoto(
          activity.inspection_id,
          activityId,
          photo.file,
          step.label,
          step.step_order
        );
      }

      toast({
        title: 'Sucesso!',
        description: 'Atividade finalizada com sucesso.',
      });

      navigate(`/inspection/${activity.inspection_id}`);
    } catch (error) {
      console.error('Erro ao finalizar atividade:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar a atividade.',
        variant: 'destructive',
      });
    } finally {
      setIsFinalizing(false);
    }
  };

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

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="container px-4 py-6">
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">Nenhuma etapa encontrada</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Vistoria Guiada - Atividade Adicional</title>
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 py-6 max-w-2xl">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </button>

          {/* Progress */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Etapa {currentStepIndex + 1} de {steps.length}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-2">{currentStep.label}</h2>
            <p className="text-muted-foreground mb-4">{currentStep.instruction}</p>

            {currentStep.illustration_url && (
              <img
                src={currentStep.illustration_url}
                alt={currentStep.label}
                className="w-full rounded-lg mb-4"
              />
            )}

            {/* Photo Preview */}
            {currentPhoto ? (
              <div className="mb-4">
                <img
                  src={currentPhoto.previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg border border-border"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center mb-4">
                <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma foto capturada</p>
              </div>
            )}

            {/* File Input */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-input"
            />

            <Button
              onClick={() => document.getElementById('photo-input')?.click()}
              className="w-full"
              size="lg"
              variant={currentPhoto ? 'outline' : 'default'}
            >
              <Camera className="h-5 w-5 mr-2" />
              {currentPhoto ? 'Tirar Outra Foto' : 'Tirar Foto'}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              variant="outline"
              size="lg"
            >
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={isFinalizing}
              className="flex-1"
              size="lg"
            >
              {isFinalizing ? (
                <>
                  <Upload className="h-5 w-5 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : isLastStep ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Finalizar
                </>
              ) : (
                'Próxima'
              )}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
