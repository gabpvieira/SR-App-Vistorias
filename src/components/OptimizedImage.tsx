import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Transforma URL do Supabase Storage para usar transformação de imagem
 * Reduz tamanho e melhora performance
 */
function getOptimizedUrl(url: string, width: number, quality: number): string {
  if (!url) return '';
  
  // Se for URL do Supabase Storage, adicionar transformação
  if (url.includes('supabase.co/storage')) {
    // Supabase Image Transformation
    // Formato: /render/image/public/bucket/path?width=X&quality=Y
    const urlObj = new URL(url);
    
    // Verificar se já tem parâmetros de transformação
    if (urlObj.searchParams.has('width')) {
      return url;
    }
    
    // Adicionar parâmetros de transformação
    urlObj.searchParams.set('width', width.toString());
    urlObj.searchParams.set('quality', quality.toString());
    
    return urlObj.toString();
  }
  
  return url;
}

/**
 * Componente de imagem otimizado com:
 * - Lazy loading nativo
 * - Placeholder enquanto carrega
 * - Fade-in suave
 * - Tratamento de erro
 * - Transformação de URL para thumbnails
 */
export function OptimizedImage({
  src,
  alt,
  className,
  width = 400,
  height,
  quality = 75,
  placeholder,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Carregar 100px antes de entrar na viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // URL otimizada
  const optimizedSrc = src ? getOptimizedUrl(src, width, quality) : '';

  // Se não tem src ou deu erro, mostrar placeholder
  if (!src || hasError) {
    return (
      <div 
        ref={imgRef}
        className={cn(
          'bg-muted flex items-center justify-center',
          className
        )}
      >
        {placeholder}
      </div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={cn('relative overflow-hidden bg-muted', className)}
    >
      {/* Placeholder/Skeleton enquanto carrega */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
      )}
      
      {/* Imagem real - só carrega quando está na viewport */}
      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}
