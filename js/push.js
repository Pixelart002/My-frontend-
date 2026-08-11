// js/push.js

const SW_URL = '/sw.js';

const registerSW = async () => {
 if (!isSupported()) {
  console.warn('[PUSH] Push notifications are not supported.');
  return null;
 }
 
 try {
  // Don't HEAD-fetch /sw.js manually.
  // Let the browser perform the actual Service Worker validation.
  const registration = await navigator.serviceWorker.register(SW_URL, {
   scope: '/',
  });
  
  // Wait until the SW is actually ready.
  const readyRegistration = await navigator.serviceWorker.ready;
  
  console.info('[PUSH] Service Worker ready:', readyRegistration.scope);
  
  return readyRegistration;
 } catch (error) {
  console.error('[PUSH] Service Worker registration failed:', error);
  
  if (typeof PUSH !== 'undefined') {
   PUSH.lastError =
    `Service Worker registration failed: ${error?.message || error}`;
  }
  
  return null;
 }
};


const subscribe = async () => {
 try {
  if (!isSupported()) {
   throw new Error('Push notifications are not supported in this browser.');
  }
  
  // 1. Permission
  const permission = await Notification.requestPermission();
  
  if (permission !== 'granted') {
   throw new Error(`Notification permission: ${permission}`);
  }
  
  // 2. Service Worker
  const registration = await registerSW();
  
  if (!registration) {
   throw new Error('Service Worker registration failed.');
  }
  
  // 3. VAPID key
  const vapidKey = await getVapidKey();
  
  if (!vapidKey) {
   throw new Error('VAPID public key was not returned by the server.');
  }
  
  // 4. Existing subscription
  let subscription = await registration.pushManager.getSubscription();
  
  // 5. Create subscription only if one doesn't already exist
  if (!subscription) {
   const applicationServerKey =
    urlBase64ToUint8Array(vapidKey);
   
   subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
   });
  }
  
  console.info(
   '[PUSH] Push subscription created/found:',
   subscription.endpoint
  );
  
  // 6. Save to backend
  const result = await saveSubscription(subscription);
  
  console.info('[PUSH] Subscription saved:', result);
  
  return result;
  
 } catch (error) {
  console.error('[PUSH] Subscription failed:', error);
  
  if (typeof PUSH !== 'undefined') {
   PUSH.lastError =
    error?.message || String(error);
  }
  
  throw error;
 }
};