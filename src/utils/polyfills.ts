/**
 * Polyfills e Fallbacks para Chrome 109+ (Windows 7)
 * 
 * Este arquivo fornece verificações de suporte e fallbacks
 * para APIs que podem não estar disponíveis em navegadores legados.
 */

/**
 * Verifica se Service Worker é suportado
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator && 'caches' in window;
}

/**
 * Verifica se IntersectionObserver é suportado
 */
export function isIntersectionObserverSupported(): boolean {
  return 'IntersectionObserver' in window;
}

/**
 * Verifica se Web Share API é suportada
 */
export function isWebShareSupported(): boolean {
  return 'share' in navigator;
}

/**
 * Verifica se Clipboard API é suportada
 */
export function isClipboardSupported(): boolean {
  return 'clipboard' in navigator;
}

/**
 * Verifica se beforeinstallprompt é suportado
 */
export function isInstallPromptSupported(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Fallback para copiar texto para clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Tentar API moderna primeiro
  if (isClipboardSupported()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, using fallback');
    }
  }
  
  // Fallback usando execCommand (deprecated mas funciona em navegadores antigos)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    return false;
  }
}

/**
 * Fallback para compartilhar conteúdo
 */
export async function shareContent(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
  // Tentar Web Share API primeiro
  if (isWebShareSupported()) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      // Usuário cancelou ou erro
      if ((err as Error).name !== 'AbortError') {
        console.warn('Web Share failed, using fallback');
      }
    }
  }
  
  // Fallback: copiar URL para clipboard
  const shareText = data.url || data.text || '';
  if (shareText) {
    const copied = await copyToClipboard(shareText);
    if (copied) {
      // Notificar usuário que foi copiado
      return true;
    }
  }
  
  return false;
}

/**
 * Formatar data com fallback para navegadores sem suporte a locales
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }
  
  try {
    // Tentar usar Intl.DateTimeFormat com locale pt-BR
    return new Intl.DateTimeFormat('pt-BR', options).format(dateObj);
  } catch (err) {
    // Fallback manual
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    if (options?.dateStyle === 'short' || !options) {
      return `${day}/${month}/${year}`;
    }
    
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
}

/**
 * Formatar número com fallback
 */
export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat('pt-BR', options).format(num);
  } catch (err) {
    // Fallback simples
    return num.toLocaleString();
  }
}

/**
 * Observer de interseção com fallback
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (!isIntersectionObserverSupported()) {
    console.warn('IntersectionObserver not supported');
    return null;
  }
  
  return new IntersectionObserver(callback, options);
}

/**
 * Lazy loading de imagens com fallback
 */
export function setupLazyLoading(images: NodeListOf<HTMLImageElement> | HTMLImageElement[]): void {
  const imageArray = Array.from(images);
  
  if (isIntersectionObserverSupported()) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });
    
    imageArray.forEach((img) => observer.observe(img));
  } else {
    // Fallback: carregar todas as imagens imediatamente
    imageArray.forEach((img) => {
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
    });
  }
}

/**
 * Registrar Service Worker com verificação de suporte
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Worker not supported in this browser');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('[App] Service Worker registered:', registration.scope);
    
    // Verificar atualizações
    registration.addEventListener('updatefound', () => {
      console.log('[App] Service Worker update found');
    });
    
    return registration;
  } catch (error) {
    console.error('[App] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Verificar se PWA pode ser instalado
 */
let deferredPrompt: Event | null = null;

export function setupInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir prompt automático
    e.preventDefault();
    deferredPrompt = e;
    console.log('[App] Install prompt available');
  });
}

export function canInstallPWA(): boolean {
  return deferredPrompt !== null;
}

export async function installPWA(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('[App] Install prompt not available');
    return false;
  }
  
  try {
    // @ts-ignore - beforeinstallprompt não tem tipos padrão
    deferredPrompt.prompt();
    // @ts-ignore
    const result = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return result.outcome === 'accepted';
  } catch (error) {
    console.error('[App] Install failed:', error);
    return false;
  }
}

/**
 * Detectar se está rodando como PWA instalado
 */
export function isRunningAsPWA(): boolean {
  // Verificar display-mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // iOS Safari
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  return false;
}

/**
 * Verificar suporte a recursos do navegador
 */
export function getBrowserSupport() {
  return {
    serviceWorker: isServiceWorkerSupported(),
    intersectionObserver: isIntersectionObserverSupported(),
    webShare: isWebShareSupported(),
    clipboard: isClipboardSupported(),
    installPrompt: isInstallPromptSupported(),
    isPWA: isRunningAsPWA(),
  };
}
