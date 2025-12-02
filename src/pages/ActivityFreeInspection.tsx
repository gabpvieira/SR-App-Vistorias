import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Check, X, Upload } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { uploadAndSaveActivityPhoto } from '@/lib/supabase-queries';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

interface CapturedPhoto {
  file: File;
  preview: string;
  label: string;
}

export default function ActivityFreeInspection() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [currentLabel, setCurrentLabel] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const preview = URL.createObjectURL(file);

    setPhotos([...photos, { file, preview, label: currentLabel || `Foto ${photos.length + 1}` }]);
    setCurrentLabel('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    URL.revokeObjectURL(photos[index].preview);
    setPhotos(newPhotos);
  };

  const handleSubmit = async () => {
    if (!activityId || photos.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos uma foto antes de finalizar.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Precisamos do inspection_id - vamos buscar da atividade
      const { data: activity } = await supabase
        .from('inspection_activities')
        .select('inspection_id')
        .eq('id', activityId)
        .single();

      if (!activity) throw new Error('Atividade não encontrada');

      // Upload de todas as fotos
      for (const photo of photos) {
        await uploadAndSaveActivityPhoto(
          activity.inspection_id,
          activityId,
          photo.file,
          photo.label
        );
      }

      toast({
        title: 'Sucesso!',
        description: `${photos.length} foto(s) adicionada(s) com sucesso.`,
      });

      // Voltar para a página de detalhes da vistoria
      navigate(`/inspection/${activity.inspection_id}`);
    } catch (error) {
      console.error('Erro ao salvar fotos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as fotos. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Vistoria Livre - Atividade Adicional</title>
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

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">Vistoria Livre - Atividade Adicional</h1>
            <p className="text-muted-foreground">
              Adicione fotos livremente com descrições personalizadas
            </p>
          </div>

          {/* Input de foto */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Descrição da foto (opcional)
              </label>
              <input
                type="text"
                value={currentLabel}
                onChange={(e) => setCurrentLabel(e.target.value)}
                placeholder="Ex: Painel frontal, Motor, etc."
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring"
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              size="lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Adicionar Foto
            </Button>
          </div>

          {/* Lista de fotos */}
          {photos.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="font-semibold mb-4">Fotos Capturadas ({photos.length})</h2>
              <div className="space-y-4">
                {photos.map((photo, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                    <img
                      src={photo.preview}
                      alt={photo.label}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{photo.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => removePhoto(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={uploading || photos.length === 0}
              className="flex-1"
              size="lg"
            >
              {uploading ? (
                <>
                  <Upload className="h-5 w-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Finalizar Atividade
                </>
              )}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
