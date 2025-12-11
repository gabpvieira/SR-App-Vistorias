/**
 * Utilitários para otimização de imagens
 */

/**
 * Comprime uma imagem antes do upload
 * Reduz significativamente o tamanho do arquivo
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: string;
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1440,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        // Calcular dimensões mantendo aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha ao comprimir imagem'));
              return;
            }

            // Criar novo File com o blob comprimido
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: mimeType }
            );

            URL.revokeObjectURL(img.src);
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Falha ao carregar imagem'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Gera URL de thumbnail do Supabase Storage
 * Usa a API de transformação de imagens
 */
export function getThumbnailUrl(
  originalUrl: string,
  width: number = 400,
  quality: number = 60
): string {
  if (!originalUrl) return '';
  
  // Verificar se é URL do Supabase
  if (!originalUrl.includes('supabase.co/storage') && !originalUrl.includes('supabase.in/storage')) {
    return originalUrl;
  }

  try {
    const url = new URL(originalUrl);
    
    // Substituir /object/ por /render/image/
    const newPath = url.pathname.replace('/storage/v1/object/', '/storage/v1/render/image/');
    url.pathname = newPath;
    
    // Adicionar parâmetros de transformação
    url.searchParams.set('width', width.toString());
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('resize', 'contain');
    
    return url.toString();
  } catch {
    return originalUrl;
  }
}

/**
 * Verifica se o navegador suporta WebP
 */
export function supportsWebP(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
}

/**
 * Gera placeholder de baixa qualidade (LQIP)
 */
export async function generateLQIP(file: File, size: number = 20): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context não disponível'));
      return;
    }

    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const width = size;
      const height = Math.round(size / aspectRatio);

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.3));
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Falha ao gerar LQIP'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Comprime imagem para upload otimizado com LQIP
 */
export async function compressForUpload(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg';
  } = {}
): Promise<{ file: File; lqip: string }> {
  const {
    maxWidth = 1920,
    maxHeight = 1440,
    quality = 0.8,
    format = supportsWebP() ? 'webp' : 'jpeg',
  } = options;

  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context não disponível'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;
      const aspectRatio = width / height;

      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      }

      if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }

      canvas.width = width;
      canvas.height = height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Gerar LQIP
      const lqipCanvas = document.createElement('canvas');
      const lqipCtx = lqipCanvas.getContext('2d');
      const lqipSize = 20;
      lqipCanvas.width = lqipSize;
      lqipCanvas.height = Math.round(lqipSize / aspectRatio);
      lqipCtx?.drawImage(canvas, 0, 0, lqipCanvas.width, lqipCanvas.height);
      const lqip = lqipCanvas.toDataURL('image/jpeg', 0.3);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            URL.revokeObjectURL(img.src);
            reject(new Error('Falha ao comprimir imagem'));
            return;
          }

          const extension = format === 'webp' ? '.webp' : '.jpg';
          const newFileName = file.name.replace(/\.[^.]+$/, extension);

          const compressedFile = new File([blob], newFileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          URL.revokeObjectURL(img.src);
          resolve({ file: compressedFile, lqip });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Falha ao carregar imagem'));
    };

    img.src = URL.createObjectURL(file);
  });
}
