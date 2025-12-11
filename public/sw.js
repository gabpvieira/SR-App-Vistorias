/**
 * Service Worker - SR Vistorias PWA
 * Versão otimizada para performance de imagens
 */

const CACHE_NAME = 'sr-vistorias-v5';
const OFFLINE_URL = '/offline.html';

// Assets estáticos para precache (apenas arquivos locais essenciais)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

/**
 * Verifica se a URL deve ser completamente ignorada pelo SW
 * Retorna true para URLs que NUNCA devem ser interceptadas
 */
function shouldBypass(url) {
  // Ignorar todas as URLs do Supabase (API, Storage, Auth, etc.)
  if (url.includes('supabase.co') || url.includes('supabase.in')) {
    return true;
  }
  
  // Ignorar outras APIs externas
  if (url.includes('/api/') || url.includes('/rest/') || url.includes('/auth/')) {
    return true;
  }
  
  return false;
}

/**
 * Verifica se é um asset estático local que pode ser cacheado
 */
function isStaticAsset(url, origin) {
  const urlObj = new URL(url);
  
  // Apenas assets do mesmo origin
  if (urlObj.origin !== origin) {
    return false;
  }
  
  // Apenas arquivos estáticos (JS, CSS, fontes, ícones locais)
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.ico'];
  return staticExtensions.some(ext => url.includes(ext));
}

// INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Install error:', err))
  );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// FETCH - Estratégia simplificada
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;
  
  // 1. BYPASS: Nunca interceptar Supabase ou APIs externas
  if (shouldBypass(url)) {
    return; // Deixa o navegador lidar diretamente
  }
  
  // 2. Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // 3. Ignorar extensões de navegador
  if (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://')) {
    return;
  }
  
  // 4. Para navegação (HTML), usar Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // 5. Para assets estáticos locais, usar Cache First
  if (isStaticAsset(url, self.location.origin)) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;
          
          return fetch(request).then(response => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
          });
        })
    );
    return;
  }
  
  // 6. Para todo o resto (imagens externas, etc.), NÃO interceptar
  // Deixa o navegador lidar diretamente para máxima performance
});

// MESSAGE
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// PUSH
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'SR Vistorias', body: 'Nova notificação' };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' }
    })
  );
});

// NOTIFICATION CLICK
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow(event.notification.data?.url || '/');
      })
  );
});

console.log('[SW] Service Worker v5 loaded - Optimized for image performance');
