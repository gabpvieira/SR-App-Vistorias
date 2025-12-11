/**
 * Componente de Imagem Otimizada
 * 
 * Funcionalidades:
 * - Lazy loading nativo + Intersection Observer
 * - Placeholder LQIP com blur durante carregamento
 * - Suporte a srcset responsivo
 * - Fallback para formatos não suportados
 * - Skeleton loading animado
 * - Compatível com Chrome 109+ (Windows 7)
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import {
  getSupabaseThumbnailUrl,
  getSupabaseSrcSet,
  generateSizesAttribute,
  isMobileDevice,
  getOptimalImageWidth,
} from '@/lib/image-optimizer';

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'placeholder'> {
  /** URL da imagem */
  src: string;
  /** Texto alternativo (obrigatório para acessibilidade) */
  alt: string;
  /** Largura da imagem */
  width?: number;
  /** Altura da imagem */
  height?: number;
  /** Placeholder LQIP (base64) ou URL */
  placeholder?: string;
  /** Cor de fundo do placeholder */
  placeholderColor?: string;
  /** Layout para cálculo de sizes */
  layout?: 'full' | 'half' | 'third' | 'quarter' | 'thumbnail';
  /** Qualidade da imagem (0-100) */
  quality?: number;
  /** Desabilitar lazy loading */
  eager?: boolean;
  /** Prioridade de carregamento */
  priority?: boolean;
  /** Mostrar skeleton durante carregamento */
  showSkeleton?: boolean;
  /** Duração da transição de fade (ms) */
  fadeDuration?: number;
  /** Callback quando imagem carrega */
  onLoadComplete?: () => void;
  /** Callback em caso de erro */
  onLoadError?: (error: Error) => void;
  /** Classes do container */
  containerClassName?: string;
  /** Aspect ratio (ex: "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Objeto fit */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Posição do objeto */
  objectPosition?: string;
}

/**
 * Componente de imagem otimizada com lazy loading e placeholders
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  placeholder,
  placeholderColor = '#f3f4f6',
  layout = 'full',
  quality = 75,
  eager = false,
  priority = false,
  showSkeleton = true,
  fadeDuration = 300,
  onLoadComplete,
  onLoadError,
  containerClassName,
  aspectRatio,
  objectFit = 'cover',
  objectPosition = 'center',
  className,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(eager || priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular URL otimizada
  const getOptimizedSrc = useCallback(() => {
    if (!src) return '';
    
    // Se é URL do Supabase, usar transformação
    if (src.includes('supabase.co/storage') || src.includes('supabase.in/storage')) {
      const containerWidth = containerRef.current?.offsetWidth || (isMobileDevice() ? 640 : 1024);
      const optimalWidth = width || getOptimalImageWidth(containerWidth);
      return getSupabaseThumbnailUrl(src, optimalWidth, quality);
    }
    
    return src;
  }, [src, width, quality]);

  // Gerar srcset
  const srcSet = React.useMemo(() => {
    if (!src) return '';
    if (src.includes('supabase.co/storage') || src.includes('supabase.in/storage')) {
      return getSupabaseSrcSet(src);
    }
    return '';
  }, [src]);

  // Gerar sizes
  const sizes = React.useMemo(() => generateSizesAttribute(layout), [layout]);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (eager || priority || !containerRef.current) {
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
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [eager, priority]);

  // Carregar imagem quando entrar na viewport
  useEffect(() => {
    if (!isInView || !src) return;

    const optimizedSrc = getOptimizedSrc();
    setCurrentSrc(optimizedSrc);
  }, [isInView, src, getOptimizedSrc]);

  // Handler de carregamento
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoadComplete?.();
  }, [onLoadComplete]);

  // Handler de erro
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onLoadError?.(new Error(`Falha ao carregar imagem: ${src}`));
    
    // Fallback para URL original se a otimizada falhar
    if (currentSrc !== src) {
      setCurrentSrc(src);
    }
  }, [src, currentSrc, onLoadError]);

  // Adicionar preload link para imagens prioritárias
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getOptimizedSrc();
      if (srcSet) {
        link.setAttribute('imagesrcset', srcSet);
        link.setAttribute('imagesizes', sizes);
      }
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src, srcSet, sizes, getOptimizedSrc]);

  // Estilos do container
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: placeholderColor,
    ...(aspectRatio && { aspectRatio }),
  };

  // Estilos da imagem
  const imageStyles: React.CSSProperties = {
    objectFit,
    objectPosition,
    opacity: isLoaded ? 1 : 0,
    transition: `opacity ${fadeDuration}ms ease-in-out`,
    ...style,
  };

  // Estilos do placeholder
  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition,
    filter: 'blur(20px)',
    transform: 'scale(1.1)',
    opacity: isLoaded ? 0 : 1,
    transition: `opacity ${fadeDuration}ms ease-in-out`,
  };

  // Estilos do skeleton
  const skeletonStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(90deg, ${placeholderColor} 25%, #e5e7eb 50%, ${placeholderColor} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    opacity: isLoaded || placeholder ? 0 : 1,
    transition: `opacity ${fadeDuration}ms ease-in-out`,
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative', containerClassName)}
      style={containerStyles}
    >
      {/* Skeleton loading */}
      {showSkeleton && !placeholder && (
        <div style={skeletonStyles} aria-hidden="true" />
      )}

      {/* Placeholder LQIP */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          style={placeholderStyles}
        />
      )}

      {/* Imagem principal */}
      {isInView && currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={srcSet || undefined}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={eager || priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full',
            hasError && 'hidden',
            className
          )}
          style={imageStyles}
          {...props}
        />
      )}

      {/* Fallback de erro */}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted"
          role="img"
          aria-label={alt}
        >
          <div className="text-center text-muted-foreground p-4">
            <svg
              className="w-8 h-8 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Imagem indisponível</span>
          </div>
        </div>
      )}

      {/* CSS para animação do skeleton */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
});

// ============================================
// COMPONENTE DE GALERIA OTIMIZADA
// ============================================

export interface OptimizedGalleryProps {
  images: string[];
  columns?: 2 | 3 | 4;
  gap?: number;
  aspectRatio?: string;
  quality?: number;
  onImageClick?: (index: number) => void;
  className?: string;
}

export const OptimizedGallery = memo(function OptimizedGallery({
  images,
  columns = 3,
  gap = 12,
  aspectRatio = '4/3',
  quality = 70,
  onImageClick,
  className,
}: OptimizedGalleryProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div
      className={cn('grid', gridCols[columns], className)}
      style={{ gap }}
    >
      {images.map((src, index) => (
        <button
          key={`${src}-${index}`}
          onClick={() => onImageClick?.(index)}
          className="relative overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:opacity-90 transition-opacity"
          style={{ aspectRatio }}
        >
          <OptimizedImage
            src={src}
            alt={`Imagem ${index + 1}`}
            layout="thumbnail"
            quality={quality}
            aspectRatio={aspectRatio}
            className="w-full h-full"
          />
        </button>
      ))}
    </div>
  );
});

// ============================================
// COMPONENTE DE IMAGEM COM PICTURE (AVIF/WEBP)
// ============================================

export interface PictureImageProps extends OptimizedImageProps {
  /** URL da versão AVIF */
  avifSrc?: string;
  /** URL da versão WebP */
  webpSrc?: string;
}

export const PictureImage = memo(function PictureImage({
  src,
  avifSrc,
  webpSrc,
  alt,
  ...props
}: PictureImageProps) {
  return (
    <picture>
      {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      <OptimizedImage src={src} alt={alt} {...props} />
    </picture>
  );
});

export default OptimizedImage;
