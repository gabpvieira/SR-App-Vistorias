/**
 * Hook para carregamento otimizado de imagens
 * 
 * Funcionalidades:
 * - Lazy loading inteligente
 * - Placeholder LQIP durante carregamento
 * - Cache em memória
 * - Retry automático em caso de falha
 * - Suporte a srcset responsivo
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  imageCache,
  getSupabaseThumbnailUrl,
  getSupabaseSrcSet,
  preloadImage,
  isMobileDevice,
  getOptimalImageWidth,
} from '@/lib/image-optimizer';

export interface UseOptimizedImageOptions {
  /** URL da imagem */
  src: string;
  /** Largura do container (para calcular tamanho ideal) */
  containerWidth?: number;
  /** Placeholder LQIP (base64) */
  placeholder?: string;
  /** Habilitar lazy loading */
  lazy?: boolean;
  /** Margem do Intersection Observer */
  rootMargin?: string;
  /** Qualidade da imagem (0-100) */
  quality?: number;
  /** Número de tentativas em caso de erro */
  retries?: number;
  /** Callback quando imagem carrega */
  onLoad?: () => void;
  /** Callback em caso de erro */
  onError?: (error: Error) => void;
}

export interface UseOptimizedImageResult {
  /** URL atual da imagem (pode ser placeholder ou final) */
  currentSrc: string;
  /** srcset para imagens responsivas */
  srcSet: string;
  /** Se a imagem está carregando */
  isLoading: boolean;
  /** Se houve erro no carregamento */
  hasError: boolean;
  /** Se a imagem final foi carregada */
  isLoaded: boolean;
  /** Ref para o elemento (necessário para lazy loading) */
  ref: React.RefObject<HTMLImageElement>;
  /** Função para forçar reload */
  reload: () => void;
}

export function useOptimizedImage(
  options: UseOptimizedImageOptions
): UseOptimizedImageResult {
  const {
    src,
    containerWidth,
    placeholder,
    lazy = true,
    rootMargin = '200px',
    quality = 75,
    retries = 2,
    onLoad,
    onError,
  } = options;

  const [currentSrc, setCurrentSrc] = useState<string>(placeholder || '');
  const [srcSet, setSrcSet] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(!lazy);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const retryCount = useRef<number>(0);
  const abortController = useRef<AbortController | null>(null);

  // Calcular URL otimizada
  const getOptimizedUrl = useCallback(() => {
    if (!src) return '';
    
    // Se é URL do Supabase, usar transformação
    if (src.includes('supabase.co/storage') || src.includes('supabase.in/storage')) {
      const width = containerWidth 
        ? getOptimalImageWidth(containerWidth)
        : isMobileDevice() ? 640 : 1024;
      return getSupabaseThumbnailUrl(src, width, quality);
    }
    
    return src;
  }, [src, containerWidth, quality]);

  // Gerar srcset
  const generateSrcSet = useCallback(() => {
    if (!src) return '';
    
    if (src.includes('supabase.co/storage') || src.includes('supabase.in/storage')) {
      return getSupabaseSrcSet(src);
    }
    
    return '';
  }, [src]);

  // Carregar imagem
  const loadImage = useCallback(async () => {
    if (!src || !isInView) return;

    // Verificar cache
    const cacheKey = `${src}-${containerWidth || 'auto'}`;
    const cached = imageCache.get(cacheKey);
    if (cached) {
      setCurrentSrc(cached);
      setIsLoading(false);
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const optimizedUrl = getOptimizedUrl();
    const newSrcSet = generateSrcSet();
    setSrcSet(newSrcSet);

    try {
      await preloadImage(optimizedUrl);
      
      setCurrentSrc(optimizedUrl);
      setIsLoading(false);
      setIsLoaded(true);
      retryCount.current = 0;
      onLoad?.();
    } catch (error) {
      if (retryCount.current < retries) {
        retryCount.current++;
        // Retry com delay exponencial
        setTimeout(() => loadImage(), Math.pow(2, retryCount.current) * 500);
      } else {
        setHasError(true);
        setIsLoading(false);
        onError?.(error as Error);
      }
    }
  }, [src, isInView, containerWidth, getOptimizedUrl, generateSrcSet, retries, onLoad, onError]);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [lazy, rootMargin]);

  // Carregar quando entrar na viewport
  useEffect(() => {
    if (isInView) {
      loadImage();
    }
  }, [isInView, loadImage]);

  // Cleanup
  useEffect(() => {
    return () => {
      abortController.current?.abort();
    };
  }, []);

  // Função de reload
  const reload = useCallback(() => {
    retryCount.current = 0;
    setHasError(false);
    setIsLoaded(false);
    loadImage();
  }, [loadImage]);

  return {
    currentSrc: currentSrc || placeholder || '',
    srcSet,
    isLoading,
    hasError,
    isLoaded,
    ref: imgRef,
    reload,
  };
}

// ============================================
// HOOK PARA PRELOAD DE IMAGENS
// ============================================

export interface UseImagePreloaderOptions {
  urls: string[];
  enabled?: boolean;
  concurrency?: number;
}

export function useImagePreloader(options: UseImagePreloaderOptions) {
  const { urls, enabled = true, concurrency = 3 } = options;
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled || urls.length === 0) {
      setIsComplete(true);
      return;
    }

    let cancelled = false;

    const loadImages = async () => {
      const queue = [...urls];
      const loading = new Set<Promise<void>>();

      while (queue.length > 0 || loading.size > 0) {
        if (cancelled) break;

        // Adicionar mais à fila se tiver espaço
        while (queue.length > 0 && loading.size < concurrency) {
          const url = queue.shift()!;
          
          const promise = preloadImage(url)
            .then(() => {
              if (!cancelled) {
                setLoaded((prev) => new Set([...prev, url]));
              }
            })
            .catch(() => {
              if (!cancelled) {
                setFailed((prev) => new Set([...prev, url]));
              }
            })
            .finally(() => {
              loading.delete(promise);
            });

          loading.add(promise);
        }

        // Esperar pelo menos uma completar
        if (loading.size > 0) {
          await Promise.race(loading);
        }
      }

      if (!cancelled) {
        setIsComplete(true);
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [urls, enabled, concurrency]);

  return {
    loaded,
    failed,
    isComplete,
    progress: urls.length > 0 ? (loaded.size + failed.size) / urls.length : 1,
  };
}

// ============================================
// HOOK PARA LAZY LOADING DE LISTA
// ============================================

export function useImageLazyList(
  images: string[],
  options: { batchSize?: number; delay?: number } = {}
) {
  const { batchSize = 4, delay = 100 } = options;
  const [visibleCount, setVisibleCount] = useState(batchSize);

  useEffect(() => {
    if (visibleCount >= images.length) return;

    const timer = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + batchSize, images.length));
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleCount, images.length, batchSize, delay]);

  return {
    visibleImages: images.slice(0, visibleCount),
    hasMore: visibleCount < images.length,
    loadMore: () => setVisibleCount((prev) => Math.min(prev + batchSize, images.length)),
    loadAll: () => setVisibleCount(images.length),
  };
}
