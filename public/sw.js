/**
 * Service Worker - SR Vistorias PWA
 * Versão 6 - Compatível com Chrome 109+ (Windows 7)
 * 
 * Características:
 * - Versionamento manual de cache
 * - Fallbacks para APIs não suportadas
 * - Sem uso de APIs modernas não disponíveis no Chrome 109
 * - skipWaiting() e clients.claim() para atualização automática
 */

// Versionamento de cache - incrementar ao fazer deploy
var CACHE_VERSION = 'v6';
var CACHE_NAME = 'sr-vistorias-' + CACHE_VERSION;
var OFFLINE_URL = '/offline.html';

// Assets para precache
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

// URLs que NUNCA devem ser interceptadas
var BYPASS_PATTERNS = [
  'supabase.co',
  'supabase.in',
  '/auth/',
  '/rest/',
  '/storage/',
  '/realtime/',
  '/functions/',
  '/api/'
];

function shouldBypass(url) {
  for (var i = 0; i < BYPASS_PATTERNS.length; i++) {
    if (url.indexOf(BYPASS_PATTERNS[i]) !== -1) {
      return true;
    }
  }
  return false;
}

function isLocalStaticAsset(url, origin) {
  try {
    var urlObj = new URL(url);
    if (urlObj.origin !== origin) {
      return false;
    }
    var staticExtensions = ['.js', '.css', '.woff2', '.woff', '.ttf', '.ico'];
    for (var i = 0; i < staticExtensions.length; i++) {
      if (url.indexOf(staticExtensions[i]) !== -1) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

self.addEventListener('install', function(event) {
  console.log('[SW] Installing version ' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        var promises = PRECACHE_URLS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Failed to cache: ' + url);
          });
        });
        return Promise.all(promises);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Activating version ' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        var deletePromises = [];
        for (var i = 0; i < cacheNames.length; i++) {
          var name = cacheNames[i];
          if (name.indexOf('sr-vistorias-') === 0 && name !== CACHE_NAME) {
            deletePromises.push(caches.delete(name));
          }
        }
        return Promise.all(deletePromises);
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = request.url;
  
  if (shouldBypass(url)) {
    return;
  }
  
  if (request.method !== 'GET') {
    return;
  }
  
  if (url.indexOf('chrome-extension://') === 0 || url.indexOf('moz-extension://') === 0) {
    return;
  }
  
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(request).then(function(cached) {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }
  
  if (isLocalStaticAsset(url, self.location.origin)) {
    event.respondWith(
      caches.match(request).then(function(cached) {
        if (cached) {
          fetch(request).then(function(response) {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(request, response);
              });
            }
          }).catch(function() {});
          return cached;
        }
        
        return fetch(request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, clone);
            });
          }
          return response;
        }).catch(function() {
          return caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', function(event) {
  if (!self.registration || typeof self.registration.showNotification !== 'function') {
    return;
  }
  
  var data = { title: 'SR Vistorias', body: 'Nova notificação' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      try {
        data.body = event.data.text();
      } catch (e2) {}
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'SR Vistorias', {
      body: data.body || 'Nova notificação',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  var urlToOpen = '/';
  if (event.notification.data && event.notification.data.url) {
    urlToOpen = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (typeof client.focus === 'function') {
            return client.focus();
          }
        }
        if (typeof clients.openWindow === 'function') {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[SW] Service Worker ' + CACHE_VERSION + ' loaded');
