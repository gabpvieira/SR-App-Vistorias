/**
 * Componente de Imagem com Lazy Loading Simplificado
 * 
 * Versão leve do OptimizedImage para uso em listas e grids
 * com foco em performance e simplicidade.
 * 
 * Compatível com Chrome 109+ (Windows 7)
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { getSupabaseThumbnailUrl } from '@/lib/image-optimizer';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** URL da imagem */
  src: string;
  /** Texto alternativo */
  alt: string;
  /** Largura para otimização (Supabase) */
  optimizedWidth?: number;
  /** Qualidade para otimização (0-100) */
  quality?: number;
  /** Cor de fundo do placeholder */
  placeholderColor?: string;
  /** Desabilitar lazy loading */
  eager?: boolean;
  /** Aspect ratio (ex: "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Classes do wrapper */
  wrapperClassName?: string;
  /** Callback quando carrega */
  onLoadComplete?: () => void;
}

/**
 * Componente de imagem com lazy loading nativo e otimização
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  optimizedWidth = 400,
  quality = 70,
  placeholderColor = '#f3f4f6',
  eager = false,
  aspectRatio,
  wrapperClassName,
  className,
  style,
  onLoadComplete,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Gerar URL otimizada para Supabase
  const optimizedSrc = React.useMemo(() => {
    if (!src) return '';
    if (src.includes('supabase.co/storage') || src.includes('supabase.in/storage')) {
      return getSupabaseThumbnailUrl(src, optimizedWidth, quality);
    }
    return src;
  }, [src, optimizedWidth, quality]);

  // Reset estado quando src muda
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  // Estilos do wrapper
  const wrapperStyles: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: placeholderColor,
    ...(aspectRatio && { aspectRatio }),
  };

  // Estilos da imagem
  const imageStyles: React.CSSProperties = {
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 200ms ease-in-out',
    ...style,
  };

  if (hasError) {
    return (
      <div
        className={cn('flex items-center justify-center bg-muted', wrapperClassName)}
        style={wrapperStyles}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-6 h-6 text-muted-foreground opacity-50"
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
      </div>
    );
  }

  return (
    <div className={wrapperClassName} style={wrapperStyles}>
      {/* Skeleton enquanto carrega */}
      {!isLoaded && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${placeholderColor} 25%, #e5e7eb 50%, ${placeholderColor} 75%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
          aria-hidden="true"
        />
      )}

      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn('w-full h-full object-cover', className)}
        style={imageStyles}
        {...props}
      />

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
// COMPONENTE DE AVATAR OTIMIZADO
// ============================================

export interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

const avatarSizes = {
  sm: { size: 32, class: 'w-8 h-8' },
  md: { size: 40, class: 'w-10 h-10' },
  lg: { size: 48, class: 'w-12 h-12' },
  xl: { size: 64, class: 'w-16 h-16' },
};

export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}: OptimizedAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const { size: pixelSize, class: sizeClass } = avatarSizes[size];

  // Gerar iniciais para fallback
  const initials = React.useMemo(() => {
    if (fallback) return fallback;
    return alt
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [alt, fallback]);

  // URL otimizada
  const optimizedSrc = React.useMemo(() => {
    if (!src) return '';
    if (src.includes('supabase.co/storage') || src.includes('supabase.in/storage')) {
      return getSupabaseThumbnailUrl(src, pixelSize * 2, 80);
    }
    return src;
  }, [src, pixelSize]);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium',
          sizeClass,
          className
        )}
        role="img"
        aria-label={alt}
      >
        <span className="text-xs">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={cn('rounded-full object-cover', sizeClass, className)}
    />
  );
});

// ============================================
// COMPONENTE DE THUMBNAIL PARA LISTAS
// ============================================

export interface ThumbnailProps {
  src: string;
  alt: string;
  size?: number;
  quality?: number;
  rounded?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Thumbnail = memo(function Thumbnail({
  src,
  alt,
  size = 80,
  quality = 60,
  rounded = true,
  className,
  onClick,
}: ThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = React.useMemo(() => {
    if (!src) return '';
    if (src.includes('supabase.co/storage') || src.includes('supabase.in/storage')) {
      return getSupabaseThumbnailUrl(src, size * 2, quality);
    }
    return src;
  }, [src, size, quality]);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'bg-muted flex items-center justify-center',
          rounded && 'rounded-lg',
          className
        )}
        style={containerStyle}
      >
        <svg
          className="w-5 h-5 text-muted-foreground opacity-50"
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
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'relative overflow-hidden bg-muted',
        rounded && 'rounded-lg',
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        !onClick && 'cursor-default',
        className
      )}
      style={containerStyle}
    >
      {!isLoaded && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 200ms' }}
      />
    </button>
  );
});

export default LazyImage;
