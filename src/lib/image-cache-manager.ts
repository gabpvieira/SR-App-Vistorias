/**
 * Gerenciador de Cache de Imagens
 * 
 * Funcionalidades:
 * - Comunicação com Service Worker para precache
 * - Preload de imagens críticas
 * - Gerenciamento de cache HTTP
 * - Monitoramento de performance
 */

// ============================================
// COMUNICAÇÃO COM SERVICE WORKER
// ============================================

/**
 * Envia comando para o Service Worker precachear imagens
 */
export function precacheImages(urls: string[]): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PRECACHE_IMAGES',
      urls,
    });
  }
}

/**
 * Limpa o cache de imagens do Service Worker
 */
export function clearImageCache(): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_IMAGE_CACHE',
    });
  }
}

/**
 * Força atualização do Service Worker
 */
export function updateServiceWorker(): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SKIP_WAITING',
    });
  }
}

// ============================================
// PRELOAD DE IMAGENS CRÍTICAS
// ============================================

/**
 * Lista de imagens críticas para preload (logos, ícones, etc.)
 */
export const CRITICAL_IMAGES = [
  '/logo SR.png',
  '/LOGO TRANSPARENTE SR [BRANCO].png',
  '/LOGO TRANSPARENTE SR [PRETO].png',
  '/LOGO APP ICON.png',
  '/favicon.png',
  '/icon-192.png',
];

/**
 * Adiciona links de preload para imagens críticas no head
 */
export function preloadCriticalImages(): void {
  CRITICAL_IMAGES.forEach((src) => {
    // Verificar se já existe preload
    const existing = document.querySelector(`link[rel="preload"][href="${src}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    // Adicionar fetchpriority se suportado
    if ('fetchPriority' in link) {
      (link as any).fetchPriority = 'high';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Precarrega uma imagem e retorna uma Promise
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar: ${src}`));
    img.src = src;
  });
}

/**
 * Precarrega múltiplas imagens com limite de concorrência
 */
export async function preloadImages(
  urls: string[],
  concurrency: number = 3
): Promise<{ loaded: string[]; failed: string[] }> {
  const loaded: string[] = [];
  const failed: string[] = [];
  
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    chunks.push(urls.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const results = await Promise.allSettled(chunk.map(preloadImage));
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        loaded.push(chunk[index]);
      } else {
        failed.push(chunk[index]);
      }
    });
  }

  return { loaded, failed };
}

// ============================================
// MONITORAMENTO DE PERFORMANCE
// ============================================

interface ImageLoadMetrics {
  url: string;
  loadTime: number;
  size?: number;
  cached: boolean;
}

const imageMetrics: ImageLoadMetrics[] = [];

/**
 * Registra métricas de carregamento de imagem
 */
export function trackImageLoad(
  url: string,
  loadTime: number,
  cached: boolean = false,
  size?: number
): void {
  imageMetrics.push({ url, loadTime, cached, size });
  
  // Manter apenas últimas 100 métricas
  if (imageMetrics.length > 100) {
    imageMetrics.shift();
  }
}

/**
 * Obtém estatísticas de carregamento de imagens
 */
export function getImageLoadStats(): {
  totalImages: number;
  averageLoadTime: number;
  cachedPercentage: number;
  slowestImages: ImageLoadMetrics[];
} {
  if (imageMetrics.length === 0) {
    return {
      totalImages: 0,
      averageLoadTime: 0,
      cachedPercentage: 0,
      slowestImages: [],
    };
  }

  const totalLoadTime = imageMetrics.reduce((sum, m) => sum + m.loadTime, 0);
  const cachedCount = imageMetrics.filter((m) => m.cached).length;
  
  const sortedByTime = [...imageMetrics].sort((a, b) => b.loadTime - a.loadTime);

  return {
    totalImages: imageMetrics.length,
    averageLoadTime: Math.round(totalLoadTime / imageMetrics.length),
    cachedPercentage: Math.round((cachedCount / imageMetrics.length) * 100),
    slowestImages: sortedByTime.slice(0, 5),
  };
}

/**
 * Limpa métricas de carregamento
 */
export function clearImageMetrics(): void {
  imageMetrics.length = 0;
}

// ============================================
// UTILITÁRIOS DE CACHE HTTP
// ============================================

/**
 * Verifica se uma URL está no cache do navegador
 */
export async function isImageCached(url: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  
  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(url);
      if (response) return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Obtém tamanho aproximado do cache de imagens
 */
export async function getImageCacheSize(): Promise<number> {
  if (!('caches' in window)) return 0;
  
  try {
    const cache = await caches.open('sr-vistorias-images-v7');
    const keys = await cache.keys();
    
    let totalSize = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
    
    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Formata tamanho em bytes para string legível
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ============================================
// INICIALIZAÇÃO
// ============================================

/**
 * Inicializa o sistema de cache de imagens
 */
export function initImageCacheManager(): void {
  // Precarregar imagens críticas
  if (document.readyState === 'complete') {
    preloadCriticalImages();
  } else {
    window.addEventListener('load', preloadCriticalImages);
  }

  // Monitorar performance de imagens via PerformanceObserver
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)/i)) {
            const resourceEntry = entry as PerformanceResourceTiming;
            trackImageLoad(
              entry.name,
              Math.round(resourceEntry.duration),
              resourceEntry.transferSize === 0, // cached if no transfer
              resourceEntry.encodedBodySize
            );
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
    } catch {
      // PerformanceObserver não suportado ou erro
    }
  }
}

// Auto-inicializar quando o módulo é importado
if (typeof window !== 'undefined') {
  initImageCacheManager();
}
