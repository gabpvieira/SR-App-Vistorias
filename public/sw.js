/**
 * Service Worker para PWA - SR Vistorias
 * Compatível com Chrome 109+, Edge, Firefox, Safari
 * 
 * Estratégias:
 * - Network First para API/dados (nunca cachear Supabase)
 * - Cache First para assets estáticos
 * - Stale While Revalidate para HTML
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `sr-vistorias-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Assets estáticos para pré-cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

// Padrões de URL para NUNCA cachear (APIs, auth, dados dinâmicos)
const NEVER_CACHE_PATTERNS = [
  /supabase\.co/,
  /supabase\.in/,
  /\.supabase\./,
  /\/auth\//,
  /\/rest\//,
  /\/storage\//,
  /\/realtime\//,
  /\/functions\//,
  /api\//,
  /graphql/
];

// Padrões de assets estáticos para cache
const STATIC_ASSET_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.svg$/,
  /\.ico$/,
  /\.webp$/
];

/**
 * Verifica se a URL deve ser ignorada (nunca cachear)
 */
function shouldNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Verifica se é um asset estático
 */
function isStaticAsset(url) {
  return STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Verifica se é uma requisição de navegação (HTML)
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

/**
 * INSTALL - Pré-cachear assets e ativar imediatamente
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando versão:', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Cachear assets um por um para evitar falha total
        for (const asset of PRECACHE_ASSETS) {
          try {
            await cache.add(asset);
            console.log('[SW] Cacheado:', asset);
          } catch (err) {
            console.warn('[SW] Falha ao cachear:', asset, err.message);
          }
        }
        
        // Ativar imediatamente sem esperar
        await self.skipWaiting();
        console.log('[SW] Instalação concluída');
      } catch (error) {
        console.error('[SW] Erro na instalação:', error);
      }
    })()
  );
});

/**
 * ACTIVATE - Limpar caches antigos e tomar controle
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando versão:', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        // Limpar caches antigos
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.startsWith('sr-vistorias-') && name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Removendo cache antigo:', name);
              return caches.delete(name);
            })
        );
        
        // Tomar controle de todas as abas
        await self.clients.claim();
        console.log('[SW] Ativação concluída - controlando todas as abas');
      } catch (error) {
        console.error('[SW] Erro na ativação:', error);
      }
    })()
  );
});

/**
 * FETCH - Interceptar requisições com estratégias apropriadas
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // NUNCA interceptar requisições do Supabase ou APIs
  if (shouldNeverCache(url)) {
    return; // Deixar passar direto para a rede
  }
  
  // Ignorar requisições de extensões do navegador
  if (url.startsWith('chrome-extension://') || 
      url.startsWith('moz-extension://') ||
      url.startsWith('safari-extension://')) {
    return;
  }
  
  // Apenas processar requisições do mesmo origin
  const requestUrl = new URL(url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }
  
  // Estratégia baseada no tipo de requisição
  if (isNavigationRequest(request)) {
    // HTML: Network First com fallback para cache
    event.respondWith(networkFirstStrategy(request));
  } else if (isStaticAsset(url)) {
    // Assets estáticos: Cache First com revalidação
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Outros: Network First
    event.respondWith(networkFirstStrategy(request));
  }
});

/**
 * Network First Strategy
 * Tenta rede primeiro, fallback para cache
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cachear resposta válida
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Rede falhou, buscando cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Para navegação, retornar index.html (SPA)
    if (isNavigationRequest(request)) {
      const indexResponse = await caches.match('/index.html');
      if (indexResponse) {
        return indexResponse;
      }
    }
    
    // Resposta de erro offline
    return new Response('Você está offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/**
 * Cache First Strategy
 * Busca cache primeiro, atualiza em background
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Revalidar em background (stale-while-revalidate)
    revalidateInBackground(request);
    return cachedResponse;
  }
  
  // Se não tem cache, buscar da rede
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Falha ao buscar asset:', request.url);
    return new Response('Asset não disponível offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Revalidar cache em background
 */
async function revalidateInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silenciosamente ignorar erros de revalidação
  }
}

/**
 * MESSAGE - Responder a comandos do cliente
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  console.log('[SW] Mensagem recebida:', type);
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case 'CACHE_URLS':
      if (payload?.urls) {
        caches.open(CACHE_NAME).then(cache => {
          cache.addAll(payload.urls);
        });
      }
      break;
  }
});

/**
 * PUSH - Notificações push
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const title = data.title || 'SR Vistorias';
    const options = {
      body: data.body || 'Nova notificação',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'default',
      data: { url: data.url || '/' },
      requireInteraction: false,
      silent: false
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[SW] Erro ao processar push:', error);
  }
});

/**
 * NOTIFICATION CLICK - Abrir app ao clicar
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focar janela existente se possível
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Abrir nova janela
        return clients.openWindow(urlToOpen);
      })
  );
});

console.log('[SW] Service Worker carregado - versão:', CACHE_VERSION);
