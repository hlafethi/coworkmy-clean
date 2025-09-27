// Désactiver le service worker en développement
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
  self.skipWaiting();
}

/**
 * Service Worker for CoWorkMy
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'coworkmy-cache-v1';
const DYNAMIC_CACHE = 'coworkmy-dynamic-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/index.css',
  '/assets/index.js'
];

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/placeholder.svg',
  '/assets/index.css',
  '/assets/index.js',
  // Add other static assets here
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');
  
  // Forcer l'activation immédiate
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des ressources statiques');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Erreur lors de la mise en cache:', error);
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');
  
  event.waitUntil(
    Promise.all([
      // Nettoyage des anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('[Service Worker] Suppression du cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim des clients seulement après le nettoyage des caches
      self.clients.claim().then(() => {
        console.log('[Service Worker] Clients claimés avec succès');
      }).catch(error => {
        console.error('[Service Worker] Erreur lors du claim des clients:', error);
      })
    ])
  );
});

// Helper function to determine if a request should be cached
function shouldCache(url) {
  // Don't cache API requests with query parameters
  if (url.pathname.includes('/api/') && url.search) {
    return false;
  }
  
  // Don't cache authentication endpoints
  if (url.pathname.includes('/auth/')) {
    return false;
  }
  
  // Cache static assets and HTML pages
  return (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html')
  );
}

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and requests to other domains
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  
  // Network-first strategy for API requests
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses that should be cached
          if (response.ok && shouldCache(url)) {
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(event.request, clonedResponse));
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets
  if (urlsToCache.some(path => url.pathname.endsWith(path))) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached response
            return cachedResponse;
          }
          
          // If not in cache, fetch from network
          return fetch(event.request)
            .then((networkResponse) => {
              // Cache the fetched response
              if (networkResponse.ok) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
            });
        })
    );
    return;
  }
  
  // Default: try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

// Handle background sync for bookings
async function syncBookings() {
  try {
    // Get all pending bookings from IndexedDB
    const pendingBookings = await getPendingBookings();
    
    // Send each booking to the server
    for (const booking of pendingBookings) {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });
      
      // Remove from pending queue after successful submission
      await removePendingBooking(booking.id);
    }
    
    // Notify the user that bookings have been synced
    self.registration.showNotification('Bookings Synced', {
      body: 'Your bookings have been successfully submitted.',
      icon: '/favicon.ico',
    });
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Mock functions for IndexedDB operations (would be implemented in a real app)
async function getPendingBookings() {
  // In a real app, this would retrieve data from IndexedDB
  return [];
}

async function removePendingBooking(id) {
  // In a real app, this would remove the booking from IndexedDB
  console.log(`[Service Worker] Removed pending booking: ${id}`);
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nouvelle notification',
      icon: data.icon || '/assets/logo.png',
      badge: '/assets/logo.png',
      data: {
        url: data.url || '/',
      },
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notification', options)
    );
  } catch (error) {
    console.error('[Service Worker] Erreur de notification push:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        const url = event.notification.data.url || '/';
        
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
