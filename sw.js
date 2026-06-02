/* ============================================================
   Luviio Service Worker — Push Notification Handler
   ✅ MUST BE IN ROOT DIRECTORY: /sw.js
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
  try { 
    data = e.data.json(); 
  } catch { 
    // Fallback agar backend se sirf plain text aaye
    data = { title: 'Luviio', body: e.data.text(), url: '/' }; 
  }
  
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    vibrate: [100, 50, 100],
    data: { 
      url: data.url || '/',
      // Backend (Python) seconds mein bhejta hai, JS milliseconds use karta hai
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now() 
    },
    actions: data.actions || [],
    tag: data.tag || 'luviio-notification',
    renotify: data.renotify !== undefined ? data.renotify : false,
    timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(),
  };

  e.waitUntil(
    self.registration.showNotification(data.title || 'Luviio', options)
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  // 1. Default URL from payload
  let targetUrl = e.notification.data?.url || '/';

  // 2. Action Button Routing (Agar notification pe koi specific button click kiya ho)
  if (e.action) {
    // Agar action string koi valid URL hai, toh wahan bhejo
    if (e.action.startsWith('http') || e.action.startsWith('/')) {
      targetUrl = e.action;
    }
  }

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Agar website ka koi tab pehle se open hai, toh usey aage laao aur redirect karo
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Agar website open nahi hai, toh naya tab kholo
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
