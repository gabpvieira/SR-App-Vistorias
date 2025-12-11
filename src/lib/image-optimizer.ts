/**
 * Sistema de Otimização de Imagens
 * 
 * Funcionalidades:
 * - Compressão automática com WebP/AVIF (fallback JPG)
 * - Geração de thumbnails e placeholders LQIP
 * - Detecção de suporte a formatos modernos
 * - Cache inteligente de imagens processadas
 * - Responsive srcset generation
 * 
 * Compatível com Chrome 109+ (Windows 7)
 */

// ============================================
// DETECÇÃO DE SUPORTE A FORMATOS
// ============================================

let webpSupport: boolean | null = null;
let avifSupport: boolean | null = null;

/**
 * Verifica suporte a WebP de forma assíncrona
 */
export async function checkWebPSupport(): Promise<boolean> {
  if (webpSupport !== null) return webpSupport;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      webpSupport = img.width > 0 && img.height > 0;
      resolve(webpSupport);
    };
    img.onerror = () => {
      webpSupport = false;
      resolve(false);
    };
    // Smallest WebP image (1x1 pixel)
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  });
}

/**
 * Verifica suporte a AVIF de forma assíncrona
 */
export async function checkAVIFSupport(): Promise<boolean> {
  if (avifSupport !== null) return avifSupport;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      avifSupport = img.width > 0 && img.height > 0;
      resolve(avifSupport);
    };
    img.onerror = () => {
      avifSupport = false;
      resolve(false);
    };
    // Smallest AVIF image
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIyExAAAAAP+j9P4w==';
  });
}

/**
 * Verifica suporte síncrono a WebP (canvas)
 */
export function supportsWebPSync(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
}

// ============================================
// CONFIGURAÇÕES DE QUALIDADE
// ============================================

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  generateLQIP?: boolean;
  preserveExif?: boolean;
}

export interface OptimizedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  lqip?: string; // Low Quality Image Placeholder (base64)
}

// Presets de qualidade para diferentes casos de uso
export const QUALITY_PRESETS = {
  thumbnail: { maxWidth: 200, maxHeight: 200, quality: 0.6 },
  preview: { maxWidth: 400, maxHeight: 400, quality: 0.7 },
  standard: { maxWidth: 1200, maxHeight: 1200, quality: 0.8 },
  high: { maxWidth: 1920, maxHeight: 1920, quality: 0.85 },
  original: { maxWidth: 4096, maxHeight: 4096, quality: 0.92 },
} as const;

// Breakpoints responsivos
export const RESPONSIVE_BREAKPOINTS = [320, 480, 640, 768, 1024, 1280, 1536, 1920];

// ============================================
// COMPRESSÃO E OTIMIZAÇÃO
// ============================================

/**
 * Comprime e otimiza uma imagem
 */
export async function optimizeImage(
  file: File,
  options: CompressionOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1440,
    quality = 0.8,
    format = 'auto',
    generateLQIP = false,
  } = options;

  const originalSize = file.size;
  
  // Determinar melhor formato
  let targetFormat: string;
  if (format === 'auto') {
    const hasWebP = supportsWebPSync();
    targetFormat = hasWebP ? 'image/webp' : 'image/jpeg';
  } else {
    targetFormat = `image/${format}`;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context não disponível'));
      return;
    }

    img.onload = async () => {
      try {
        // Calcular dimensões mantendo aspect ratio
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

        // Aplicar suavização para melhor qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        const blob = await new Promise<Blob>((res, rej) => {
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error('Falha ao criar blob'))),
            targetFormat,
            quality
          );
        });

        // Gerar LQIP se solicitado
        let lqip: string | undefined;
        if (generateLQIP) {
          lqip = await generateLQIPFromCanvas(canvas, ctx, img);
        }

        // Criar arquivo otimizado
        const extension = targetFormat === 'image/webp' ? '.webp' : '.jpg';
        const newFileName = file.name.replace(/\.[^.]+$/, extension);
        
        const optimizedFile = new File([blob], newFileName, {
          type: targetFormat,
          lastModified: Date.now(),
        });

        const dataUrl = await blobToDataUrl(blob);

        resolve({
          file: optimizedFile,
          blob,
          dataUrl,
          width,
          height,
          originalSize,
          compressedSize: blob.size,
          compressionRatio: Math.round((1 - blob.size / originalSize) * 100),
          format: targetFormat,
          lqip,
        });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
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
 * Gera LQIP (Low Quality Image Placeholder) - blurhash simplificado
 */
async function generateLQIPFromCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement
): Promise<string> {
  // Criar canvas pequeno para LQIP
  const lqipCanvas = document.createElement('canvas');
  const lqipCtx = lqipCanvas.getContext('2d');
  
  if (!lqipCtx) return '';

  // LQIP muito pequeno (20px de largura)
  const lqipWidth = 20;
  const lqipHeight = Math.round((img.height / img.width) * lqipWidth);
  
  lqipCanvas.width = lqipWidth;
  lqipCanvas.height = lqipHeight;

  // Desenhar versão minúscula
  lqipCtx.drawImage(canvas, 0, 0, lqipWidth, lqipHeight);

  // Aplicar blur via CSS será feito no componente
  return lqipCanvas.toDataURL('image/jpeg', 0.3);
}

/**
 * Converte Blob para Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============================================
// GERAÇÃO DE SRCSET RESPONSIVO
// ============================================

export interface ResponsiveImageSet {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
}

/**
 * Gera múltiplas versões de uma imagem para srcset
 */
export async function generateResponsiveSet(
  file: File,
  breakpoints: number[] = RESPONSIVE_BREAKPOINTS
): Promise<Map<number, OptimizedImageResult>> {
  const results = new Map<number, OptimizedImageResult>();
  
  // Obter dimensões originais
  const originalDimensions = await getImageDimensions(file);
  
  // Filtrar breakpoints menores que a imagem original
  const validBreakpoints = breakpoints.filter(bp => bp <= originalDimensions.width);
  
  // Gerar versões em paralelo (limitado a 3 por vez para não sobrecarregar)
  const chunks = chunkArray(validBreakpoints, 3);
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (width) => {
      const result = await optimizeImage(file, {
        maxWidth: width,
        maxHeight: Math.round((originalDimensions.height / originalDimensions.width) * width),
        quality: width <= 640 ? 0.7 : 0.8,
      });
      return { width, result };
    });
    
    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(({ width, result }) => {
      results.set(width, result);
    });
  }
  
  return results;
}

/**
 * Obtém dimensões de uma imagem
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Falha ao obter dimensões'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Divide array em chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================
// CACHE DE IMAGENS EM MEMÓRIA
// ============================================

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

class ImageCache {
  private cache = new Map<string, CachedImage>();
  private maxSize = 50 * 1024 * 1024; // 50MB max cache
  private currentSize = 0;

  set(key: string, blob: Blob): string {
    // Limpar cache se necessário
    while (this.currentSize + blob.size > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }

    // Revogar URL anterior se existir
    const existing = this.cache.get(key);
    if (existing) {
      URL.revokeObjectURL(existing.url);
      this.currentSize -= existing.size;
    }

    const url = URL.createObjectURL(blob);
    this.cache.set(key, {
      url,
      blob,
      timestamp: Date.now(),
      size: blob.size,
    });
    this.currentSize += blob.size;

    return url;
  }

  get(key: string): string | null {
    const cached = this.cache.get(key);
    if (cached) {
      cached.timestamp = Date.now(); // Atualizar timestamp (LRU)
      return cached.url;
    }
    return null;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    this.cache.forEach((value, key) => {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldest = key;
      }
    });

    if (oldest) {
      const item = this.cache.get(oldest);
      if (item) {
        URL.revokeObjectURL(item.url);
        this.currentSize -= item.size;
      }
      this.cache.delete(oldest);
    }
  }

  clear(): void {
    this.cache.forEach((item) => {
      URL.revokeObjectURL(item.url);
    });
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats(): { count: number; size: number; maxSize: number } {
    return {
      count: this.cache.size,
      size: this.currentSize,
      maxSize: this.maxSize,
    };
  }
}

export const imageCache = new ImageCache();

// ============================================
// UTILITÁRIOS PARA URLs DO SUPABASE
// ============================================

/**
 * Gera URL de thumbnail otimizada do Supabase Storage
 */
export function getSupabaseThumbnailUrl(
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
 * Gera srcset para imagens do Supabase
 */
export function getSupabaseSrcSet(
  originalUrl: string,
  widths: number[] = [320, 640, 1024, 1920]
): string {
  if (!originalUrl) return '';
  
  return widths
    .map((w) => `${getSupabaseThumbnailUrl(originalUrl, w, 75)} ${w}w`)
    .join(', ');
}

/**
 * Gera atributo sizes baseado no layout
 */
export function generateSizesAttribute(
  layout: 'full' | 'half' | 'third' | 'quarter' | 'thumbnail' = 'full'
): string {
  const sizeMap = {
    full: '100vw',
    half: '(max-width: 768px) 100vw, 50vw',
    third: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    quarter: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
    thumbnail: '(max-width: 640px) 50vw, 200px',
  };
  return sizeMap[layout];
}

// ============================================
// PRELOAD DE IMAGENS CRÍTICAS
// ============================================

/**
 * Precarrega imagens críticas (hero, logo, etc.)
 */
export function preloadCriticalImages(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    
    // Adicionar fetchpriority se suportado
    if ('fetchPriority' in link) {
      (link as any).fetchPriority = 'high';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Precarrega imagem em background
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Precarrega múltiplas imagens com limite de concorrência
 */
export async function preloadImages(
  urls: string[],
  concurrency: number = 3
): Promise<void> {
  const chunks = chunkArray(urls, concurrency);
  
  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(preloadImage));
  }
}

// ============================================
// DETECÇÃO DE DISPOSITIVO
// ============================================

/**
 * Detecta se é dispositivo móvel
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Obtém DPR (Device Pixel Ratio) do dispositivo
 */
export function getDevicePixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x
}

/**
 * Calcula largura ideal baseada no dispositivo
 */
export function getOptimalImageWidth(containerWidth: number): number {
  const dpr = getDevicePixelRatio();
  const optimalWidth = Math.round(containerWidth * dpr);
  
  // Encontrar breakpoint mais próximo
  const breakpoint = RESPONSIVE_BREAKPOINTS.find((bp) => bp >= optimalWidth);
  return breakpoint || RESPONSIVE_BREAKPOINTS[RESPONSIVE_BREAKPOINTS.length - 1];
}

// ============================================
// EXPORTAÇÕES ADICIONAIS
// ============================================

export {
  // Re-exportar funções do image-utils original para compatibilidade
  compressImage,
  getThumbnailUrl,
  supportsWebP,
} from './image-utils';
