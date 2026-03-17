self.addEventListener("push", function(event) {
 if (!event.data) return;
 const data = event.data.json();
 
 event.waitUntil(
  self.registration.showNotification(data.title || "MyStore", {
   body: data.body || "You have a new notification",
   icon: data.icon || "/icon-192.png",
   badge: "/icon-96.png",
   data: { url: data.url || "/" },
   actions: data.actions || [],
  })
 );
});

self.addEventListener("notificationclick", function(event) {
 event.notification.close();
 const url = event.notification.data?.url || "/";
 event.waitUntil(
  clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
   const client = clientList.find((c) => c.url === url && "focus" in c);
   if (client) return client.focus();
   return clients.openWindow(url);
  })
 );
});