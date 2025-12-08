import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Check, X, Upload, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { uploadAndSaveActivityPhoto } from '@/lib/supabase-queries';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useWatermark } from '@/hooks/use-watermark';
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
  const { addWatermark } = useWatermark({ autoRequestPermission: true });

  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessing(true);

    try {
      const newPhotos: CapturedPhoto[] = [];

      // Processar todas as fotos selecionadas
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Arquivo inválido',
            description: `${file.name} não é uma imagem válida.`,
            variant: 'destructive',
          });
          continue;
        }

        // Validar tamanho (10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'Arquivo muito grande',
            description: `${file.name} excede o tamanho máximo de 10MB.`,
            variant: 'destructive',
          });
          continue;
        }

        // Adicionar marca d'água
        const watermarkedFile = await addWatermark(file);
        const preview = URL.createObjectURL(watermarkedFile);
        const label = `Foto ${photos.length + newPhotos.length + 1}`;

        newPhotos.push({ file: watermarkedFile, preview, label });
      }

      if (newPhotos.length > 0) {
        setPhotos([...photos, ...newPhotos]);
        toast({
          title: 'Fotos adicionadas',
          description: `${newPhotos.length} foto(s) processada(s) com marca d'água.`,
        });
      }
    } catch (error) {
      console.error('Erro ao processar fotos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar as fotos.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      // Atualizar observações da atividade
      if (notes.trim()) {
        await supabase
          .from('inspection_activities')
          .update({ notes: notes.trim() })
          .eq('id', activityId);
      }

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
        <title>Atividade Livre</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
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

          {/* Observações */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <label className="block text-sm font-medium mb-2">
              Observações do novo registro
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva o status atual, alterações realizadas, observações importantes..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Adicione informações sobre o andamento e status do veículo nesta atividade
            </p>
          </div>

          {/* Input de fotos */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              size="lg"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processando fotos...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  Adicionar Fotos
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Selecione uma ou múltiplas fotos. Todas serão marcadas automaticamente.
            </p>
          </div>

          {/* Galeria de fotos */}
          {photos.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="font-semibold mb-4">Fotos Capturadas ({photos.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                      <img
                        src={photo.preview}
                        alt={photo.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Remover foto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="mt-2">
                      <p className="text-sm font-medium truncate">{photo.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={uploading || processing || photos.length === 0}
              className="flex-1"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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
