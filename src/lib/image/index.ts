/**
 * Módulo de Otimização de Imagens
 * 
 * Exporta todos os utilitários, hooks e componentes para
 * otimização e carregamento de imagens.
 * 
 * Uso:
 * import { OptimizedImage, useOptimizedImage, optimizeImage } from '@/lib/image';
 */

// Utilitários de compressão e otimização
export {
  compressImage,
  getThumbnailUrl,
  supportsWebP,
  generateLQIP,
  compressForUpload,
} from '../image-utils';

// Sistema avançado de otimização
export {
  // Detecção de suporte
  checkWebPSupport,
  checkAVIFSupport,
  supportsWebPSync,
  
  // Compressão
  optimizeImage,
  generateResponsiveSet,
  getImageDimensions,
  
  // Presets e configurações
  QUALITY_PRESETS,
  RESPONSIVE_BREAKPOINTS,
  
  // Cache em memória
  imageCache,
  
  // URLs do Supabase
  getSupabaseThumbnailUrl,
  getSupabaseSrcSet,
  generateSizesAttribute,
  
  // Preload
  preloadCriticalImages,
  preloadImage,
  preloadImages,
  
  // Detecção de dispositivo
  isMobileDevice,
  getDevicePixelRatio,
  getOptimalImageWidth,
  
  // Types
  type CompressionOptions,
  type OptimizedImageResult,
  type ResponsiveImageSet,
} from '../image-optimizer';

// Gerenciador de cache
export {
  precacheImages,
  clearImageCache,
  updateServiceWorker,
  preloadCriticalImages as preloadCritical,
  preloadImage as preload,
  preloadImages as preloadBatch,
  trackImageLoad,
  getImageLoadStats,
  clearImageMetrics,
  isImageCached,
  getImageCacheSize,
  formatBytes,
  initImageCacheManager,
  CRITICAL_IMAGES,
} from '../image-cache-manager';

// Hooks
export {
  useOptimizedImage,
  useImagePreloader,
  useImageLazyList,
  type UseOptimizedImageOptions,
  type UseOptimizedImageResult,
  type UseImagePreloaderOptions,
} from '../../hooks/useOptimizedImage';

// Componentes
export { OptimizedImage, OptimizedGallery, PictureImage } from '../../components/OptimizedImage';
export { LazyImage, OptimizedAvatar, Thumbnail } from '../../components/LazyImage';
export { PhotoGallery } from '../../components/PhotoGallery';
