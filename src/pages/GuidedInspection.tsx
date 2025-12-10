import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Check, Loader2, X, Eye } from 'lucide-react';
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
import { useWatermark } from '@/hooks/use-watermark';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CapturedPhoto {
  stepId: string;
  file: File;
  previewUrl: string;
  uploaded: boolean;
}

// Helper para determinar configuração de fotos por etapa
const getPhotoConfig = (label: string | undefined) => {
  const lowerLabel = label?.toLowerCase() || '';
  
  if (lowerLabel.includes('pneus dianteiros')) {
    return { min: 2, max: 2, isMultiple: true };
  }
  if (lowerLabel.includes('pneus traseiros')) {
    return { min: 6, max: 6, isMultiple: true };
  }
  if (lowerLabel.includes('interna lado motorista') && !lowerLabel.includes('cabine')) {
    return { min: 2, max: 2, isMultiple: true };
  }
  if (lowerLabel.includes('interna lado passageiro')) {
    return { min: 1, max: 2, isMultiple: true };
  }
  if (lowerLabel.includes('detalhes em observação')) {
    return { min: 1, max: 10, isMultiple: true };
  }
  
  return { min: 1, max: 1, isMultiple: false };
};

export default function GuidedInspection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addInspection } = useInspections();
  const { toast } = useToast();

  const vehicleModel = searchParams.get('model') as VehicleModel;
  const vehiclePlate = searchParams.get('plate') || '';
  const modelName = searchParams.get('modelName') || '';
  const fabricationYear = searchParams.get('fabricationYear') || '';
  const modelYear = searchParams.get('modelYear') || '';
  const vehicleStatus = searchParams.get('vehicleStatus') as 'novo' | 'seminovo' || 'seminovo';

  const [steps, setSteps] = useState<InspectionStepTemplate[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [photos, setPhotos] = useState<Map<string, CapturedPhoto>>(new Map());
  const [multiplePhotos, setMultiplePhotos] = useState<Map<string, CapturedPhoto[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingGallery, setIsProcessingGallery] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);

  const { addWatermark } = useWatermark({ autoRequestPermission: true });

  // URL da imagem de exemplo baseada no índice da etapa (apenas para cavalo)
  const exampleImageUrl = vehicleModel === 'cavalo' && currentStepIndex < 15 
    ? `/exemplos-etapas/${currentStepIndex + 1}.png` 
    : null;

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

  // Scroll para o topo quando a etapa mudar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStepIndex]);

  const currentStep = steps[currentStepIndex];
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  
  // Configuração de fotos da etapa atual
  const photoConfig = getPhotoConfig(currentStep?.label);
  const isMultiplePhotosStep = photoConfig.isMultiple;
  
  const currentPhoto = currentStep ? photos.get(currentStep.id) : null;
  const currentMultiplePhotos = currentStep ? multiplePhotos.get(currentStep.id) || [] : [];
  const hasPhotos = isMultiplePhotosStep ? currentMultiplePhotos.length > 0 : !!currentPhoto;

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

    setIsProcessingGallery(true);

    try {
      // Adicionar marca d'água na foto da galeria
      const watermarkedFile = await addWatermark(file);
      const previewUrl = URL.createObjectURL(watermarkedFile);
      
      if (isMultiplePhotosStep) {
        // Etapa com múltiplas fotos
        const currentPhotos = multiplePhotos.get(currentStep.id) || [];
        
        if (currentPhotos.length >= photoConfig.max) {
          toast({
            title: 'Limite atingido',
            description: `Máximo de ${photoConfig.max} foto(s) por etapa`,
            variant: 'destructive',
          });
          setIsProcessingGallery(false);
          return;
        }
        
        const newMultiplePhotos = new Map(multiplePhotos);
        newMultiplePhotos.set(currentStep.id, [
          ...currentPhotos,
          {
            stepId: currentStep.id,
            file: watermarkedFile,
            previewUrl,
            uploaded: false,
          }
        ]);
        setMultiplePhotos(newMultiplePhotos);
        
        toast({
          title: 'Foto adicionada',
          description: `${currentPhotos.length + 1} foto(s) adicionada(s)`,
        });
      } else {
        // Etapa com foto única
        const newPhotos = new Map(photos);
        newPhotos.set(currentStep.id, {
          stepId: currentStep.id,
          file: watermarkedFile,
          previewUrl,
          uploaded: false,
        });
        setPhotos(newPhotos);

        toast({
          title: 'Foto adicionada',
          description: 'Foto processada com marca d\'água',
        });
      }
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a foto',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingGallery(false);
    }
  };

  const handleCameraCapture = () => {
    setShowCameraModal(true);
  };

  const handleWatermarkPhotoCapture = (file: File) => {
    if (!currentStep) return;

    const previewUrl = URL.createObjectURL(file);
    
    const stepPhotoConfig = getPhotoConfig(currentStep.label);
    
    if (stepPhotoConfig.isMultiple) {
      // Etapa com múltiplas fotos
      const currentPhotos = multiplePhotos.get(currentStep.id) || [];
      
      if (currentPhotos.length >= stepPhotoConfig.max) {
        toast({
          title: 'Limite atingido',
          description: `Máximo de ${stepPhotoConfig.max} foto(s) por etapa`,
          variant: 'destructive',
        });
        return;
      }
      
      const newMultiplePhotos = new Map(multiplePhotos);
      newMultiplePhotos.set(currentStep.id, [
        ...currentPhotos,
        {
          stepId: currentStep.id,
          file,
          previewUrl,
          uploaded: false,
        }
      ]);
      setMultiplePhotos(newMultiplePhotos);
    } else {
      // Etapa com foto única
      const newPhotos = new Map(photos);
      newPhotos.set(currentStep.id, {
        stepId: currentStep.id,
        file,
        previewUrl,
        uploaded: false,
      });
      setPhotos(newPhotos);
    }
  };

  const handleNext = () => {
    // Validar se tem fotos
    if (isMultiplePhotosStep) {
      if (currentMultiplePhotos.length < photoConfig.min) {
        toast({
          title: 'Fotos insuficientes',
          description: `Adicione pelo menos ${photoConfig.min} foto(s) antes de continuar.`,
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!currentPhoto) {
        toast({
          title: 'Foto obrigatória',
          description: 'Tire ou selecione uma foto antes de continuar.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (isLastStep) {
      handleFinalize();
    } else {
      setCurrentStepIndex(prev => prev + 1);
      // Scroll para o topo da página
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      // Scroll para o topo da página
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (!currentStep) return;

    if (isMultiplePhotosStep) {
      const currentPhotos = multiplePhotos.get(currentStep.id) || [];
      const photoToRemove = currentPhotos[index];
      
      // Revogar URL do preview
      if (photoToRemove.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }
      
      // Remover foto do array
      const newPhotos = currentPhotos.filter((_, i) => i !== index);
      const newMultiplePhotos = new Map(multiplePhotos);
      
      if (newPhotos.length === 0) {
        newMultiplePhotos.delete(currentStep.id);
      } else {
        newMultiplePhotos.set(currentStep.id, newPhotos);
      }
      
      setMultiplePhotos(newMultiplePhotos);
      
      toast({
        title: 'Foto removida',
        description: `${newPhotos.length} foto(s) restante(s)`,
      });
    }
  };

  const handleFinalize = async () => {
    if (!user) return;

    // Check if all steps have photos (considerando etapas com múltiplas fotos)
    const missingSteps = steps.filter(step => {
      const stepConfig = getPhotoConfig(step.label);
      
      if (stepConfig.isMultiple) {
        const stepPhotos = multiplePhotos.get(step.id) || [];
        return stepPhotos.length < stepConfig.min;
      } else {
        return !photos.has(step.id);
      }
    });
    
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
        vehicle_year: parseInt(fabricationYear),
        vehicle_model_year: parseInt(modelYear),
        vehicle_status: vehicleStatus,
        is_guided_inspection: true,
        guided_photos_complete: true,
        status: 'concluida',
        completed_at: new Date().toISOString(),
      });

      // Upload all single photos
      const singlePhotoPromises = Array.from(photos.values()).map(async (photo) => {
        const step = steps.find(s => s.id === photo.stepId);
        if (!step) return;

        await uploadAndSaveInspectionPhoto(
          inspection.id,
          photo.file,
          step.label,
          step.step_order
        );
      });

      // Upload all multiple photos
      const multiplePhotoPromises: Promise<any>[] = [];
      multiplePhotos.forEach((photosList, stepId) => {
        const step = steps.find(s => s.id === stepId);
        if (!step) return;

        photosList.forEach((photo, index) => {
          multiplePhotoPromises.push(
            uploadAndSaveInspectionPhoto(
              inspection.id,
              photo.file,
              `${step.label} - Foto ${index + 1}`,
              step.step_order
            )
          );
        });
      });

      await Promise.all([...singlePhotoPromises, ...multiplePhotoPromises]);

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
        <main className="container px-4 sm:px-6 lg:px-8 py-6">
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
        <title>Processo Guiado</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 sm:px-6 lg:px-8 py-6 max-w-2xl">
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
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-xl font-bold">{currentStep.label}</h3>
                {exampleImageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExampleModal(true)}
                    className="shrink-0 text-xs h-8 px-2"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Ver Exemplo
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground">{currentStep.instruction}</p>
            </div>

            {/* Photo Preview or Placeholder - 4:3 aspect ratio */}
            {isMultiplePhotosStep ? (
              // Múltiplas fotos
              <div className="mb-6">
                {currentMultiplePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {currentMultiplePhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                        <img
                          src={photo.previewUrl}
                          alt={`${currentStep.label} - Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg hover:bg-destructive/90 transition-colors"
                          disabled={isFinalizing}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-muted rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma foto capturada
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {photoConfig.min === photoConfig.max 
                          ? `Quantidade: ${photoConfig.min} foto(s)`
                          : `Mínimo: ${photoConfig.min} | Máximo: ${photoConfig.max} fotos`
                        }
                      </p>
                    </div>
                  </div>
                )}
                
                {currentMultiplePhotos.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {currentMultiplePhotos.length} de {photoConfig.max} foto(s)
                      {currentMultiplePhotos.length < photoConfig.min && ` - Faltam ${photoConfig.min - currentMultiplePhotos.length}`}
                      {currentMultiplePhotos.length >= photoConfig.min && currentMultiplePhotos.length < photoConfig.max && ` - Mínimo atingido ✓`}
                      {currentMultiplePhotos.length >= photoConfig.max && ` - Completo ✓`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Foto única
              <div className="aspect-[4/3] bg-muted rounded-lg mb-6 overflow-hidden flex items-center justify-center">
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
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCameraCapture}
                variant="outline"
                className="w-full"
                disabled={isFinalizing || (isMultiplePhotosStep && currentMultiplePhotos.length >= photoConfig.max)}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isMultiplePhotosStep && currentMultiplePhotos.length > 0 ? 'Tirar Mais' : 'Tirar Foto'}
              </Button>

              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                variant="outline"
                className="w-full"
                disabled={isFinalizing || isProcessingGallery || (isMultiplePhotosStep && currentMultiplePhotos.length >= photoConfig.max)}
              >
                {isProcessingGallery ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {isMultiplePhotosStep && currentMultiplePhotos.length > 0 ? 'Adicionar Mais' : 'Galeria'}
                  </>
                )}
              </Button>

              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {!isMultiplePhotosStep && currentPhoto && (
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
              disabled={!hasPhotos || isFinalizing}
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
              {(() => {
                // Contar etapas completas (considerando múltiplas fotos)
                let completedSteps = 0;
                steps.forEach(step => {
                  const stepConfig = getPhotoConfig(step.label);
                  
                  if (stepConfig.isMultiple) {
                    const stepPhotos = multiplePhotos.get(step.id) || [];
                    if (stepPhotos.length >= stepConfig.min) {
                      completedSteps++;
                    }
                  } else {
                    if (photos.has(step.id)) {
                      completedSteps++;
                    }
                  }
                });
                return completedSteps;
              })()} de {steps.length} etapas concluídas
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

        {/* Modal de Exemplo */}
        <Dialog open={showExampleModal} onOpenChange={setShowExampleModal}>
          <DialogContent className="max-w-lg p-4">
            <DialogHeader>
              <DialogTitle className="text-base">Exemplo: {currentStep.label}</DialogTitle>
            </DialogHeader>
            {exampleImageUrl && (
              <div className="mt-2">
                <img
                  src={exampleImageUrl}
                  alt={`Exemplo - ${currentStep.label}`}
                  className="w-full h-auto rounded-lg border"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
