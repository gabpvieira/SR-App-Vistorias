/**
 * Service Worker - SR Vistorias PWA
 * 
 * Este SW implementa:
 * - Precache de assets estáticos
 * - Network First para dados/API
 * - Cache First para assets
 * - Suporte offline
 * - Push notifications
 * - Background sync
 */

const CACHE_NAME = 'sr-vistorias-v3';
const OFFLINE_URL = '/offline.html';

// Assets para precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

// URLs que NUNCA devem ser cacheadas
const NEVER_CACHE = [
  'supabase.co',
  'supabase.in',
  '/auth/',
  '/rest/',
  '/storage/',
  '/realtime/',
  '/functions/'
];

// Verificar se URL deve ser ignorada
function shouldSkipCache(url) {
  return NEVER_CACHE.some(pattern => url.includes(pattern));
}

// INSTALL - Precache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// ACTIVATE - Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// FETCH - Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // NUNCA cachear Supabase/API
  if (shouldSkipCache(url)) {
    return;
  }
  
  // Ignorar extensões de navegador
  if (url.startsWith('chrome-extension://') || 
      url.startsWith('moz-extension://')) {
    return;
  }
  
  // Estratégia: Network First com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cachear resposta válida
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback para cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Para navegação, retornar index.html (SPA)
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          // Página offline como último recurso
          return caches.match(OFFLINE_URL);
        });
      })
  );
});

// MESSAGE - Comunicação com o cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// PUSH - Notificações push
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = { title: 'SR Vistorias', body: 'Nova notificação' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// NOTIFICATION CLICK - Abrir app
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focar janela existente
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Abrir nova janela
        return clients.openWindow(urlToOpen);
      })
  );
});

// SYNC - Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Implementar sincronização de dados pendentes
      Promise.resolve()
    );
  }
});

// PERIODIC SYNC - Sincronização periódica
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'update-content') {
    event.waitUntil(
      // Atualizar conteúdo em background
      Promise.resolve()
    );
  }
});

console.log('[SW] Service Worker loaded');
