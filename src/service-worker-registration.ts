import { logger } from '@/utils/logger';
// Enregistrement du service worker désactivé temporairement pour debug
// if (import.meta.env.PROD && 'serviceWorker' in navigator) {
//   window.addEventListener('load', async () => {
//     try {
//       const registration = await navigator.serviceWorker.register('/service-worker.js', {
//         type: 'module',
//         scope: '/'
//       });
//
//       logger.debug('Service Worker enregistré avec succès:', registration);
//
//       // Gestion des mises à jour
//       registration.addEventListener('updatefound', () => {
//         const newWorker = registration.installing;
//         if (newWorker) {
//           newWorker.addEventListener('statechange', () => {
//             if (
//               newWorker.state === 'installed' &&
//               navigator.serviceWorker.controller
//             ) {
//               // Recharge la page UNE SEULE FOIS
//               if (!sessionStorage.getItem('sw-reloaded')) {
//                 sessionStorage.setItem('sw-reloaded', '1');
//                 if (registration.waiting) {
//                   registration.waiting.postMessage({ type: 'SKIP_WAITING' });
//                   navigator.serviceWorker.addEventListener('controllerchange', () => {
//                     window.location.reload();
//                   });
//                 } else {
//                   window.location.reload();
//                 }
//               }
//             }
//           });
//         }
//       });
//
//       // Vérification des mises à jour toutes les heures
//       setInterval(() => {
//         registration.update();
//       }, 60 * 60 * 1000);
//
//     } catch (error) {
//       logger.error('Erreur lors de l\'enregistrement du Service Worker:', error);
//     }
//   });
// } 