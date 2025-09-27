/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Précache des ressources statiques
precacheAndRoute(self.__WB_MANIFEST);

// Configuration du cache pour les images et icônes
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 jours
      })
    ]
  })
);

// Configuration pour les ressources de développement Vite
registerRoute(
  ({ url }) => url.pathname.startsWith('/@vite/') || 
              url.pathname.startsWith('/@react-refresh') ||
              url.pathname.includes('?t='),
  new StaleWhileRevalidate({
    cacheName: 'vite-dev-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Configuration pour les routes de l'application
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'app-routes',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 heures
        })
      ]
    }),
    {
      allowlist: [
        /^\/$/,
        /^\/auth\/.*$/,
        /^\/dashboard$/,
        /^\/profile$/,
        /^\/spaces$/,
        /^\/booking$/,
        /^\/support$/,
        /^\/legal.*$/
      ],
      denylist: [
        /\.(?:png|jpg|jpeg|svg|gif)$/,
        /supabase\.co/
      ]
    }
  )
);

// Gestion des événements du service worker
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[Service Worker] Installation...');
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open('app-routes').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png'
        ]);
      }),
      caches.open('pwa-icons').then((cache) => {
        return cache.addAll([
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png'
        ]);
      })
    ])
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[Service Worker] Activation...');
  self.clients.claim();
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== 'images' && 
                cacheName !== 'pwa-icons' &&
                cacheName !== 'api-cache' && 
                cacheName !== 'vite-dev-cache' && 
                cacheName !== 'app-routes') {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Gestion des erreurs de fetch
self.addEventListener('fetch', (event: FetchEvent) => {
  // Ne pas intercepter les requêtes vers Supabase
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  // Ne pas intercepter les requêtes d'API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Gestion spéciale pour les icônes
  if (event.request.url.includes('/icons/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((fetchResponse) => {
          if (!fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }
          return caches.open('pwa-icons').then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Fallback SPA pour les navigations
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open('app-routes');
        const cachedResponse = await cache.match('/index.html');
        return cachedResponse || fetch('/index.html');
      })
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        // Si la réponse est 404 ou erreur, essayer de servir index.html
        if (response.status === 404 || !response.ok) {
          const cache = await caches.open('app-routes');
          const cachedResponse = await cache.match('/index.html');
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        return response;
      } catch (error) {
        console.error('[Service Worker] Erreur de fetch:', error);
        // Essayer de servir index.html en cas d'erreur
        try {
          const cache = await caches.open('app-routes');
          const cachedResponse = await cache.match('/index.html');
          if (cachedResponse) {
            return cachedResponse;
          }
        } catch (cacheError) {
          console.error('[Service Worker] Erreur de cache:', cacheError);
        }
        return new Response('Erreur de réseau', {
          status: 500,
          statusText: 'Erreur de réseau',
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      }
    })()
  );
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 