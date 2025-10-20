/* eslint-disable no-restricted-globals */
// Service Worker for Restaurant POS - Offline Support

const CACHE_NAME = 'restaurant-pos-v1';
const API_CACHE = 'restaurant-pos-api-v1';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache.map(url => new Request(url, {credentials: 'same-origin'})));
      })
      .catch((err) => {
        console.log('[ServiceWorker] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extension and non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Only cache successful GET requests
          if (request.method === 'GET' && response.status === 200) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[ServiceWorker] Serving API from cache:', request.url);
              return cachedResponse;
            }
            
            // Return offline response for failed requests
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'You are currently offline. Please check your internet connection.' 
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - Cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline page for navigation requests
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Background sync for queued orders
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(
      // Get queued orders from IndexedDB and sync
      syncQueuedOrders()
    );
  }
});

// Sync queued orders when online
async function syncQueuedOrders() {
  try {
    // This will be implemented with IndexedDB
    console.log('[ServiceWorker] Syncing queued orders...');
    
    // Send message to all clients that sync is happening
    const allClients = await self.clients.matchAll();
    allClients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED'
      });
    });
    
    // TODO: Implement IndexedDB integration
    
    // Notify clients sync is complete
    allClients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED'
      });
    });
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log('[ServiceWorker] Loaded');

