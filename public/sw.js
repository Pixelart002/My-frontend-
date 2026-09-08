/* Luviio production service worker: push notifications only. */

const RESYNC_CACHE = 'luviio-push-resync-v3';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Luviio', body: event.data.text(), url: '/' };
  }

  const options = {
    body: data.body || '',
    data: {
      url: data.url || '/',
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(),
    },
    actions: Array.isArray(data.actions) ? data.actions : [],
    tag: data.tag || 'luviio-notification',
    renotify: data.renotify === true,
    vibrate: [100, 50, 100],
  };

  // Only use notification assets when the backend supplies real public URLs.
  // The old defaults pointed at /src assets and /js/config.js, neither of which
  // is guaranteed to exist in the Vite production output.
  if (typeof data.icon === 'string' && data.icon) options.icon = data.icon;
  if (typeof data.badge === 'string' && data.badge) options.badge = data.badge;

  event.waitUntil(self.registration.showNotification(data.title || 'Luviio Update', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let targetUrl = event.notification.data?.url || '/';
  if (event.action && (event.action.startsWith('http') || event.action.startsWith('/'))) targetUrl = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(targetUrl) : undefined;
    }),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const options = event.oldSubscription?.options;
      if (!options) return;
      const newSub = await self.registration.pushManager.subscribe(options);
      const cache = await caches.open(RESYNC_CACHE);
      await cache.put('/__pending-resub__', new Response(JSON.stringify(newSub.toJSON()), {
        headers: { 'Content-Type': 'application/json' },
      }));
      const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windowClients) client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: newSub.toJSON() });
    } catch (err) {
      console.error('[Luviio SW] push subscription rotation failed:', err);
    }
  })());
});
