import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CameraWithWatermark } from './CameraWithWatermark';

interface WatermarkCameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCapture: (file: File) => void;
  title?: string;
  description?: string;
}

export function WatermarkCameraModal({
  open,
  onOpenChange,
  onPhotoCapture,
  title = 'Tirar Foto',
  description = 'A foto será marcada automaticamente com data, hora e localização',
}: WatermarkCameraModalProps) {
  const handleCapture = (file: File) => {
    onPhotoCapture(file);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <CameraWithWatermark
          onPhotoCapture={handleCapture}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
