/* ============================================================
   LUVIIO — Push Notification Manager (Strict Production Build)
   Path: /js/push.js
   Dependencies: api.js, auth.js
   ============================================================ */

const PUSH = (() => {
 const SW_URL = '/sw.js';
 const VAPID_CACHE_KEY = '__lv_vapid';
 const DISMISS_KEY = '__lv_push_prompt_dismissed';
 
 const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
 };
 
 const isSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
 
 const notifPermission = () =>
  typeof Notification !== 'undefined' ? Notification.permission : 'denied';
 
 // Strict Production Registration with MIME Type Validation
 const registerSW = async () => {
  if (!isSupported()) return null;
  try {
   // Pre-flight check to prevent the dreaded TypeError
   const checkResponse = await fetch(SW_URL, { method: 'HEAD' });
   if (!checkResponse.ok) {
    console.error(`[PUSH] SW file missing at ${SW_URL} (HTTP ${checkResponse.status})`);
    return null;
   }
   
   const contentType = checkResponse.headers.get('content-type');
   if (contentType && contentType.includes('text/html')) {
    console.error(`[PUSH] Fatal: ${SW_URL} is returning HTML instead of JavaScript. Check your server routing.`);
    return null;
   }
   
   await navigator.serviceWorker.register(SW_URL);
   return await navigator.serviceWorker.ready;
  } catch (err) {
   console.error('[PUSH] SW Registration failed:', err);
   return null;
  }
 };
 
 const getVapidKey = async (forceRefresh = false) => {
  try {
   if (!forceRefresh) {
    const cached = sessionStorage.getItem(VAPID_CACHE_KEY);
    if (cached) return cached;
   }
   
   if (typeof API === 'undefined') throw new Error("API module not loaded");
   
   const data = await API.getVapidKey();
   if (!data) return null;
   
   const key = data.public_key || null;
   if (key) sessionStorage.setItem(VAPID_CACHE_KEY, key);
   return key;
  } catch (err) {
   console.error('[PUSH] VAPID Fetch failed:', err);
   return null;
  }
 };
 
 const saveSubscription = async (subscription) => {
  if (typeof API === 'undefined') throw new Error('API module not loaded');
  // 🔥 FIX: previously this caught the error and returned undefined either way,
  // so subscribe() always returned true even when the backend save failed --
  // masking the real failure behind a false "Notifications Enabled" toast.
  await API.subscribePush(subscription.toJSON());
 };
 
 const removeSubscription = async (subscription) => {
  try {
   if (typeof API !== 'undefined') await API.unsubscribePush(subscription.toJSON());
  } catch (err) {
   console.error('[PUSH] Remove Sub failed:', err);
  }
 };
 
 const showPrompt = () => {
  if (!isSupported() || !AUTH.isLoggedIn() || notifPermission() !== 'default') return;
  
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (dismissedAt && (Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000)) return;
  
  const existing = document.getElementById('luviio-push-banner');
  if (existing) existing.remove();
  
  const banner = document.createElement('div');
  banner.id = 'luviio-push-banner';
  banner.innerHTML = `
      <div style="position: fixed; bottom: 24px; left: 24px; background: var(--surface, #1e1e1e); border: 1px solid var(--border, #333); padding: 16px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 9999; width: 320px; font-family: sans-serif; display: flex; flex-direction: column; gap: 14px; animation: slideUp 0.5s ease-out;">
        <style>@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="background: var(--gold-dim, rgba(212, 175, 55, 0.15)); color: var(--gold, #d4af37); width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 22px; flex-shrink: 0;">
            <i class="ri-notification-3-line"></i>
          </div>
          <div>
            <h4 style="margin: 0; font-size: 15px; color: var(--text, #eee); font-weight: 600;">Enable Order Alerts</h4>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted, #aaa); line-height: 1.4;">Get instant updates when your order is shipped or delivered.</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 2px;">
          <button id="btn-push-later" style="background: transparent; border: 1px solid var(--border-light, #444); color: var(--text-muted, #aaa); padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: 0.2s;">Not Now</button>
          <button id="btn-push-allow" style="background: var(--gold, #d4af37); border: none; color: #000; padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s;">Allow Notifications</button>
        </div>
      </div>
    `;
  document.body.appendChild(banner);
  
  document.getElementById('btn-push-later').onclick = () => {
   localStorage.setItem(DISMISS_KEY, Date.now().toString());
   banner.style.display = 'none';
  };
  
  document.getElementById('btn-push-allow').onclick = async () => {
   banner.style.display = 'none';
   const success = await PUSH.subscribe();
   if (success && typeof showToast === 'function') {
    showToast('Notifications Enabled Successfully!', 'success');
   } else if (!success && typeof showToast === 'function') {
    showToast('Could not enable notifications: ' + (PUSH.lastError || 'unknown error'), 'error');
   }
  };
 };
 
 return {
  isSupported,
  
  async subscribe() {
   if (!isSupported() || !AUTH.isLoggedIn()) {
    console.warn('[PUSH] Push not supported or user not logged in');
    return false;
   }
   
   const permission = typeof Notification !== 'undefined' ? await Notification.requestPermission() : 'denied';
   if (permission !== 'granted') {
    console.warn('[PUSH] Notification permission denied by user');
    return false;
   }
   
   let [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
   
   if (!reg || !vapidKey) {
    console.error('[PUSH] Handshake Failed. Check console for missing SW or VAPID key.');
    return false;
   }
   
   try {
    const subscription = await reg.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    await saveSubscription(subscription);
    return true;
   } catch (err) {
    console.warn('[PUSH] First subscribe/save attempt failed. Attempting self-healing...', err);
    
    try {
     const existing = await reg.pushManager.getSubscription();
     if (existing) await existing.unsubscribe();
     
     sessionStorage.removeItem(VAPID_CACHE_KEY);
     vapidKey = await getVapidKey(true);
     
     if (!vapidKey) throw new Error("VAPID key still null after refresh");
     
     const newSubscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
     });
     await saveSubscription(newSubscription);
     return true;
    } catch (retryErr) {
     // 🔥 FIX: this is now the real, final error — surface it instead of
     // just logging it, so the UI can tell the person what actually happened
     // (e.g. "Error 500: DB constraint error") instead of a false success.
     console.error('[PUSH] Subscribe Failed Completely:', retryErr);
     PUSH.lastError = retryErr?.message || String(retryErr);
     return false;
    }
   }
  },
  
  async unsubscribe() {
   if (!isSupported()) return;
   const reg = await navigator.serviceWorker.getRegistration(SW_URL);
   if (!reg) return;
   const sub = await reg.pushManager.getSubscription();
   if (!sub) return;
   await removeSubscription(sub);
   await sub.unsubscribe();
   if (typeof showToast === 'function') showToast('Notifications Disabled', 'info');
  },
  
  async autoSubscribe() {
   if (!isSupported() || !AUTH.isLoggedIn() || notifPermission() !== 'granted') return;
   
   let [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
   if (!reg || !vapidKey) return;
   
   try {
    const existing = await reg.pushManager.getSubscription();
    if (!existing) {
     const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
     });
     await saveSubscription(sub);
    } else {
     // Sync existing subscription with backend just in case
     await saveSubscription(existing);
    }
   } catch (err) {
    console.error('[PUSH] AutoSubscribe failed:', err);
   }
  },
  
  async init() {
   if (!AUTH.isLoggedIn()) return;
   
   const run = async () => {
    await PUSH.autoSubscribe();
    await PUSH.syncPendingResubscribe();
    setTimeout(showPrompt, 2500);
   };
   
   if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 5000 });
   } else {
    setTimeout(run, 1000);
   }
  },
  
  // 🔥 NEW: picks up any subscription the SW rotated while no tab was open
  // (see sw.js's pushsubscriptionchange handler) and pushes it to the backend
  // now that we actually have the auth token available.
  async syncPendingResubscribe() {
   if (!isSupported()) return;
   try {
    const cache = await caches.open('luviio-push-resync');
    const match = await cache.match('/__pending-resub__');
    if (!match) return;
    const subJson = await match.json();
    await API.subscribePush(subJson);
    await cache.delete('/__pending-resub__');
   } catch (err) {
    console.warn('[PUSH] Pending resubscribe sync failed:', err);
   }
  },
 };
})();

// Real-time resubscribe sync if a tab is open when the SW rotates the subscription.
if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
 navigator.serviceWorker.addEventListener('message', async (event) => {
  if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED' && typeof API !== 'undefined') {
   try { await API.subscribePush(event.data.subscription); } catch (err) { console.warn('[PUSH] Live resync failed:', err); }
  }
 });
}

// Attach event listeners safely
if (typeof window !== 'undefined') {
 window.addEventListener('auth:login', () => PUSH.init());
 window.addEventListener('auth:logout', () => PUSH.unsubscribe());
 
 window.addEventListener('load', () => {
  PUSH.init();
 });
}