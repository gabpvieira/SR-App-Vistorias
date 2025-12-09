// Service Worker para PWA com auto-update silencioso
const CACHE_VERSION = 'v1';
const CACHE_NAME = `sr-vistorias-${CACHE_VERSION}`;

// Workbox manifest injection point
const PRECACHE_MANIFEST = self.__WB_MANIFEST || [];

// Assets para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

/**
 * Install - Cachear assets e ativar imediatamente
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        // Cachear assets estáticos + precache manifest do Workbox
        const allAssets = [...STATIC_ASSETS, ...PRECACHE_MANIFEST.map(entry => entry.url || entry)];
        return cache.addAll(allAssets);
      })
      .then(() => {
        console.log('[SW] Skip waiting - ativando imediatamente');
        // Ativar imediatamente sem esperar
        return self.skipWaiting();
      })
  );
});

/**
 * Activate - Tomar controle e limpar caches antigos
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deletando cache antigo:', name);
              return caches.delete(name);
            })
        );
      }),
      // Tomar controle de todas as abas imediatamente
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Ativado e controlando todas as abas');
    })
  );
});

/**
 * Fetch - Estratégia Network First com fallback para cache
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // SEMPRE ignorar requisições do Supabase (auth, rest, storage, realtime)
  // Deixar passar direto para a rede sem interceptar
  if (url.hostname.includes('supabase.co')) {
    return; // Não interceptar - deixar o navegador lidar
  }

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Apenas cachear assets locais (JS, CSS, imagens, fontes)
  const isLocalAsset = url.origin === self.location.origin;
  
  if (!isLocalAsset) {
    return; // Não cachear recursos externos
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // Se a resposta for válida, cachear apenas assets locais
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tentar buscar do cache
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Se não houver cache, retornar página offline básica
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

/**
 * Message - Responder a comandos do cliente
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING solicitado');
    self.skipWaiting();
  }
});

/**
 * Push - Notificações push (futuro)
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'SR Vistorias';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification Click - Abrir app ao clicar na notificação
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Verificar se já existe uma janela aberta
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[SW] Service Worker carregado');
