/* ============================================================
   LUVIIO — Production Service Worker (Push Notifications)
   Path: /sw.js (Must be in Root Directory)
   ============================================================ */

const CACHE_NAME = 'luviio-push-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forces the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Takes control of all pages immediately
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Luviio', body: event.data.text(), url: '/' };
  }
  
  const options = {
    body: data.body || '',
    icon: data.icon || '/img/logo.png', // Ensure this path exists
    badge: data.badge || '/img/logo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now()
    },
    actions: data.actions || [],
    tag: data.tag || 'luviio-notification',
    renotify: data.renotify !== undefined ? data.renotify : false,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Luviio Update', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let targetUrl = event.notification.data?.url || '/';
  
  if (event.action && (event.action.startsWith('http') || event.action.startsWith('/'))) {
    targetUrl = event.action;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});