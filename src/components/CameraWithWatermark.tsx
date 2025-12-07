import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatermark } from '@/hooks/use-watermark';
import { useToast } from '@/hooks/use-toast';

interface CameraWithWatermarkProps {
  onPhotoCapture: (file: File) => void;
  onCancel?: () => void;
}

export function CameraWithWatermark({ onPhotoCapture, onCancel }: CameraWithWatermarkProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    isLocationEnabled,
    currentLocation,
    isLoadingLocation,
    locationError,
    isGeolocationSupported,
    requestPermission,
    addWatermark,
  } = useWatermark({ autoRequestPermission: true });

  useEffect(() => {
    // Solicitar permissão ao montar o componente
    if (isGeolocationSupported && !isLocationEnabled && !isLoadingLocation) {
      requestPermission();
    }
  }, [isGeolocationSupported, isLocationEnabled, isLoadingLocation, requestPermission]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);

    try {
      // Adicionar marca d'água
      const watermarkedFile = await addWatermark(file);

      // Criar preview
      const previewUrl = URL.createObjectURL(watermarkedFile);
      setPreview(previewUrl);
      setCapturedFile(watermarkedFile);
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a foto',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onPhotoCapture(capturedFile);
      handleReset();
    }
  };

  const handleReset = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setCapturedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    handleReset();
    onCancel?.();
  };

  return (
    <div className="space-y-4">
      {/* Status da Localização */}
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">Localização</span>
        </div>

        {isLoadingLocation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Obtendo localização...</span>
          </div>
        )}

        {!isLoadingLocation && isLocationEnabled && currentLocation && (
          <div className="text-sm text-muted-foreground space-y-1">
            {currentLocation.city && (
              <p>📍 {currentLocation.city}{currentLocation.state ? `, ${currentLocation.state}` : ''}</p>
            )}
            <p className="text-xs">
              {currentLocation.latitude.toFixed(6)}°, {currentLocation.longitude.toFixed(6)}°
            </p>
          </div>
        )}

        {!isLoadingLocation && locationError && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{locationError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={requestPermission}
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {!isLoadingLocation && !isLocationEnabled && !locationError && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Permita o acesso à localização para adicionar informações na foto
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={requestPermission}
              className="w-full"
            >
              Permitir Localização
            </Button>
          </div>
        )}
      </div>

      {/* Preview da Foto - 4:3 aspect ratio */}
      {preview ? (
        <div className="space-y-4">
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              A foto ficou boa?
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Refazer
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Botão de Captura */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            onClick={handleCapture}
            disabled={isCapturing}
            className="w-full h-16"
            size="lg"
          >
            {isCapturing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5 mr-2" />
                Tirar Foto
              </>
            )}
          </Button>

          {onCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full"
            >
              Cancelar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
