import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Progress } from '@/components/ui/progress';
import { WatermarkCameraModal } from '@/components/WatermarkCameraModal';
import { useAuth } from '@/contexts/AuthContext';
import { useInspections } from '@/contexts/InspectionContext';
import { getStepsByVehicleModel } from '@/lib/supabase-queries';
import { uploadAndSaveInspectionPhoto } from '@/lib/supabase-queries';
import { InspectionStepTemplate, VehicleModel } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/hooks/use-toast';

interface CapturedPhoto {
  stepId: string;
  file: File;
  previewUrl: string;
  uploaded: boolean;
}

export default function GuidedInspection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addInspection } = useInspections();
  const { toast } = useToast();

  const vehicleModel = searchParams.get('model') as VehicleModel;
  const vehiclePlate = searchParams.get('plate') || '';
  const modelName = searchParams.get('modelName') || '';
  const modelYear = searchParams.get('modelYear') || '';
  const vehicleStatus = searchParams.get('vehicleStatus') as 'novo' | 'seminovo' || 'seminovo';

  const [steps, setSteps] = useState<InspectionStepTemplate[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [photos, setPhotos] = useState<Map<string, CapturedPhoto>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  useEffect(() => {
    async function loadSteps() {
      if (!vehicleModel || vehicleModel === 'livre') {
        navigate('/vistoria/nova');
        return;
      }

      try {
        const stepsData = await getStepsByVehicleModel(vehicleModel);
        setSteps(stepsData);
      } catch (error) {
        console.error('Erro ao carregar etapas:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as etapas da vistoria.',
          variant: 'destructive',
        });
        navigate('/vistoria/nova');
      } finally {
        setIsLoading(false);
      }
    }

    loadSteps();
  }, [vehicleModel, navigate, toast]);

  const currentStep = steps[currentStepIndex];
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const currentPhoto = currentStep ? photos.get(currentStep.id) : null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentStep) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB)
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
      uploaded: false,
    });
    setPhotos(newPhotos);
  };

  const handleCameraCapture = () => {
    setShowCameraModal(true);
  };

  const handleWatermarkPhotoCapture = (file: File) => {
    if (!currentStep) return;

    const previewUrl = URL.createObjectURL(file);
    const newPhotos = new Map(photos);
    newPhotos.set(currentStep.id, {
      stepId: currentStep.id,
      file,
      previewUrl,
      uploaded: false,
    });
    setPhotos(newPhotos);

    toast({
      title: 'Foto capturada',
      description: 'Foto adicionada com marca d\'água',
    });
  };

  const handleNext = () => {
    if (!currentPhoto) {
      toast({
        title: 'Foto obrigatória',
        description: 'Tire ou selecione uma foto antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (isLastStep) {
      handleFinalize();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinalize = async () => {
    if (!user) return;

    // Check if all steps have photos
    const missingSteps = steps.filter(step => !photos.has(step.id));
    if (missingSteps.length > 0) {
      toast({
        title: 'Vistoria incompleta',
        description: `Faltam ${missingSteps.length} foto(s) obrigatória(s).`,
        variant: 'destructive',
      });
      return;
    }

    setIsFinalizing(true);

    try {
      // Create inspection
      const inspection = await addInspection({
        user_id: user.id,
        type: 'troca',
        vehicle_model: vehicleModel,
        vehicle_plate: vehiclePlate,
        vehicle_model_name: modelName,
        vehicle_year: parseInt(modelYear),
        vehicle_status: vehicleStatus,
        is_guided_inspection: true,
        guided_photos_complete: true,
        status: 'concluida',
        completed_at: new Date().toISOString(),
      });

      // Upload all photos
      const uploadPromises = Array.from(photos.values()).map(async (photo, index) => {
        const step = steps.find(s => s.id === photo.stepId);
        if (!step) return;

        await uploadAndSaveInspectionPhoto(
          inspection.id,
          photo.file,
          step.label,
          step.step_order
        );
      });

      await Promise.all(uploadPromises);

      toast({
        title: 'Vistoria concluída!',
        description: 'Todas as fotos foram enviadas com sucesso.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao finalizar vistoria:', error);
      toast({
        title: 'Erro ao finalizar',
        description: 'Não foi possível concluir a vistoria. Tente novamente.',
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
          <div className="bg-card border rounded-lg p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando etapas...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!currentStep) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Vistoria Guiada - SR Caminhões</title>
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 py-6 max-w-2xl">
          <button
            onClick={() => navigate('/vistoria/nova')}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Cancelar vistoria
          </button>

          {/* Progress */}
          <div className="bg-card border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">
                Etapa {currentStepIndex + 1} de {steps.length}
              </h2>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="bg-card border rounded-lg p-6 mb-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{currentStep.label}</h3>
              <p className="text-muted-foreground">{currentStep.instruction}</p>
            </div>

            {/* Photo Preview or Placeholder */}
            <div className="aspect-video bg-muted rounded-lg mb-6 overflow-hidden flex items-center justify-center">
              {currentPhoto ? (
                <img
                  src={currentPhoto.previewUrl}
                  alt={currentStep.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma foto capturada
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCameraCapture}
                variant="outline"
                className="w-full"
                disabled={isUploading || isFinalizing}
              >
                <Camera className="h-4 w-4 mr-2" />
                Tirar Foto
              </Button>

              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                variant="outline"
                className="w-full"
                disabled={isUploading || isFinalizing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Galeria
              </Button>

              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {currentPhoto && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Foto capturada com sucesso
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              onClick={handleBack}
              variant="outline"
              disabled={currentStepIndex === 0 || isFinalizing}
              className="flex-1"
            >
              Voltar
            </Button>

            <Button
              onClick={handleNext}
              disabled={!currentPhoto || isFinalizing}
              className="flex-1"
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : isLastStep ? (
                'Finalizar Vistoria'
              ) : (
                'Próxima Etapa'
              )}
            </Button>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              {photos.size} de {steps.length} fotos capturadas
            </p>
          </div>
        </main>

        {/* Watermark Camera Modal */}
        <WatermarkCameraModal
          open={showCameraModal}
          onOpenChange={setShowCameraModal}
          onPhotoCapture={handleWatermarkPhotoCapture}
          title={currentStep.label}
          description={currentStep.instruction}
        />
      </div>
    </>
  );
}
