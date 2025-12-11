/**
 * Service Worker - SR Vistorias PWA
 * Versão 7 - Com cache otimizado de imagens
 * 
 * Características:
 * - Cache inteligente de imagens com estratégias diferenciadas
 * - Precache de assets críticos (logos, ícones)
 * - Stale-while-revalidate para imagens
 * - Cache-first para assets estáticos
 * - Compatível com Chrome 109+ (Windows 7)
 */

// Versionamento de cache - incrementar ao fazer deploy
var CACHE_VERSION = 'v7';
var CACHE_NAME = 'sr-vistorias-' + CACHE_VERSION;
var IMAGE_CACHE_NAME = 'sr-vistorias-images-' + CACHE_VERSION;
var OFFLINE_URL = '/offline.html';

// Limite de tamanho do cache de imagens (50MB)
var IMAGE_CACHE_MAX_SIZE = 50 * 1024 * 1024;
var IMAGE_CACHE_MAX_ITEMS = 100;

// Assets para precache (críticos)
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/logo SR.png',
  '/LOGO TRANSPARENTE SR [BRANCO].png',
  '/LOGO TRANSPARENTE SR [PRETO].png',
  '/LOGO APP ICON.png'
];

// Imagens de exemplo para precache
var EXAMPLE_IMAGES = [];
for (var i = 1; i <= 15; i++) {
  EXAMPLE_IMAGES.push('/exemplos-etapas/' + i + '.png');
}

// URLs que NUNCA devem ser interceptadas
var BYPASS_PATTERNS = [
  'supabase.co/auth',
  'supabase.in/auth',
  '/rest/',
  '/realtime/',
  '/functions/',
  '/api/',
  'chrome-extension://',
  'moz-extension://'
];

// Padrões de URL de imagem
var IMAGE_PATTERNS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
  '.svg',
  '/storage/v1/object/',
  '/storage/v1/render/'
];

function shouldBypass(url) {
  for (var i = 0; i < BYPASS_PATTERNS.length; i++) {
    if (url.indexOf(BYPASS_PATTERNS[i]) !== -1) {
      return true;
    }
  }
  return false;
}

function isImageRequest(url) {
  var lowerUrl = url.toLowerCase();
  for (var i = 0; i < IMAGE_PATTERNS.length; i++) {
    if (lowerUrl.indexOf(IMAGE_PATTERNS[i]) !== -1) {
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

function cleanupImageCache() {
  return caches.open(IMAGE_CACHE_NAME).then(function(cache) {
    return cache.keys().then(function(requests) {
      if (requests.length <= IMAGE_CACHE_MAX_ITEMS) {
        return Promise.resolve();
      }
      var toDelete = requests.slice(0, requests.length - IMAGE_CACHE_MAX_ITEMS);
      var deletePromises = toDelete.map(function(request) {
        return cache.delete(request);
      });
      return Promise.all(deletePromises);
    });
  });
}

self.addEventListener('install', function(event) {
  console.log('[SW] Installing version ' + CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(function(cache) {
        var promises = PRECACHE_URLS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Failed to cache: ' + url);
          });
        });
        return Promise.all(promises);
      }),
      caches.open(IMAGE_CACHE_NAME).then(function(cache) {
        var promises = EXAMPLE_IMAGES.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Failed to cache example image: ' + url);
          });
        });
        return Promise.all(promises);
      })
    ]).then(function() {
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
          if (name.indexOf('sr-vistorias-') === 0 && 
              name !== CACHE_NAME && 
              name !== IMAGE_CACHE_NAME) {
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
  
  // Estratégia para imagens: stale-while-revalidate
  if (isImageRequest(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(function(cache) {
        return cache.match(request).then(function(cachedResponse) {
          if (cachedResponse) {
            fetch(request).then(function(networkResponse) {
              if (networkResponse && networkResponse.ok) {
                cache.put(request, networkResponse.clone());
                cleanupImageCache();
              }
            }).catch(function() {});
            return cachedResponse;
          }
          
          return fetch(request).then(function(networkResponse) {
            if (networkResponse && networkResponse.ok) {
              cache.put(request, networkResponse.clone());
              cleanupImageCache();
            }
            return networkResponse;
          }).catch(function() {
            return caches.match('/placeholder.svg');
          });
        });
      })
    );
    return;
  }
  
  // Estratégia para navegação
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
  
  // Estratégia para assets estáticos: cache-first
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
  
  if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    caches.delete(IMAGE_CACHE_NAME).then(function() {
      console.log('[SW] Image cache cleared');
    });
  }
  
  if (event.data && event.data.type === 'PRECACHE_IMAGES') {
    var urls = event.data.urls || [];
    caches.open(IMAGE_CACHE_NAME).then(function(cache) {
      urls.forEach(function(url) {
        cache.add(url).catch(function() {
          console.warn('[SW] Failed to precache: ' + url);
        });
      });
    });
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

console.log('[SW] Service Worker ' + CACHE_VERSION + ' loaded with image optimization');
