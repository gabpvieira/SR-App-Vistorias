import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { uploadAndSaveInspectionPhoto } from '@/lib/supabase-queries';
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';

export function StorageTest() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setMessage('Fazendo upload...');

    try {
      // Create a test inspection ID (in real app, this would be from an actual inspection)
      const testInspectionId = 'test-' + Date.now();

      const photo = await uploadAndSaveInspectionPhoto(
        testInspectionId,
        file,
        'Teste de Upload',
        1
      );

      setStatus('success');
      setMessage('Upload realizado com sucesso!');
      setPhotoUrl(photo.photo_url);
    } catch (error) {
      setStatus('error');
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Teste de Upload de Fotos</h3>

      <div className="space-y-4">
        <div>
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={status === 'uploading'}
          />
          {file && (
            <p className="text-sm text-muted-foreground mt-2">
              Arquivo: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
          className="w-full"
        >
          {status === 'uploading' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Fazendo upload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Fazer Upload
            </>
          )}
        </Button>

        {message && (
          <div
            className={`p-4 rounded-lg border ${
              status === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : status === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {status === 'success' && <CheckCircle className="h-5 w-5" />}
              {status === 'error' && <XCircle className="h-5 w-5" />}
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        )}

        {photoUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Foto enviada:</p>
            <img
              src={photoUrl}
              alt="Upload test"
              className="w-full rounded-lg border"
            />
            <p className="text-xs text-muted-foreground mt-2 break-all">
              URL: {photoUrl}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
