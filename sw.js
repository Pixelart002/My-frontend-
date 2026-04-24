/* ============================================================
   Luviio Service Worker — Push Notification Handler
   ✅ FIX: Is file ko ROOT mein rakho: /sw.js
   (pehle galat path tha: js/Sw.js)
   ============================================================ */

const CACHE_NAME = 'luviio-v1';

self.addEventListener('install', (e) => {
 self.skipWaiting();
});

self.addEventListener('activate', (e) => {
 e.waitUntil(clients.claim());
});

self.addEventListener('push', (e) => {
 if (!e.data) return;
 let data = {};
 try { data = e.data.json(); }
 catch { data = { title: 'Luviio', body: e.data.text(), url: '/' }; }
 
 const options = {
  body: data.body || '',
  icon: data.icon || '/icon-192.png',
  badge: '/badge-72.png',
  vibrate: [100, 50, 100],
  data: { url: data.url || '/' },
  actions: data.actions || [],
  tag: data.tag || 'luviio-notification',
  renotify: false,
 };
 e.waitUntil(
  self.registration.showNotification(data.title || 'Luviio', options)
 );
});

self.addEventListener('notificationclick', (e) => {
 e.notification.close();
 const url = e.notification.data?.url || '/';
 e.waitUntil(
  clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
   for (const client of windowClients) {
    if (client.url.includes(self.location.origin) && 'focus' in client) {
     client.navigate(url);
     return client.focus();
    }
   }
   if (clients.openWindow) return clients.openWindow(url);
  })
 );
});