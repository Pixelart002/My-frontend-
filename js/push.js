/* ============================================================
   LUVIIO — Push Notification Manager  (v5 — Banner Restored)
   ============================================================ */

const PUSH = (() => {
 const SW_URL = '/sw.js';
 const VAPID_CACHE_KEY = '__lv_vapid';
 
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
 
 const registerSW = async () => {
  if (!isSupported()) return null;
  try { return await navigator.serviceWorker.register(SW_URL); }
  catch { return null; }
 };
 
 const getVapidKey = async () => {
  try {
   const cached = sessionStorage.getItem(VAPID_CACHE_KEY);
   if (cached) return cached;
   
   const r = await fetch(`${CONFIG.API_BASE}/push/vapid-key`, {
    signal: AbortSignal.timeout(5000),
   });
   if (!r.ok) return null;
   const d = await r.json();
   const key = d.public_key || null;
   if (key) sessionStorage.setItem(VAPID_CACHE_KEY, key);
   return key;
  } catch { return null; }
 };
 
 const saveSubscription = async (subscription) => {
  const token = AUTH.getToken();
  if (!token) return;
  try {
   await fetch(`${CONFIG.API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(subscription.toJSON()),
    signal: AbortSignal.timeout(5000),
   });
  } catch {}
 };
 
 const removeSubscription = async (subscription) => {
  const token = AUTH.getToken();
  if (!token) return;
  try {
   await fetch(`${CONFIG.API_BASE}/push/unsubscribe`, {
    method: 'DELETE',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(subscription.toJSON()),
    signal: AbortSignal.timeout(5000),
   });
  } catch {}
 };
 
 return {
  isSupported,
  
  async subscribe() {
   if (!isSupported() || !AUTH.isLoggedIn()) return false;
   
   const permission = typeof Notification !== 'undefined' ?
    await Notification.requestPermission() :
    'denied';
   if (permission !== 'granted') return false;
   
   const [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
   if (!reg || !vapidKey) return false;
   
   try {
    const subscription = await reg.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    await saveSubscription(subscription);
    return true;
   } catch { return false; }
  },
  
  async unsubscribe() {
   if (!isSupported()) return;
   const reg = await navigator.serviceWorker.getRegistration(SW_URL);
   if (!reg) return;
   const sub = await reg.pushManager.getSubscription();
   if (!sub) return;
   await removeSubscription(sub);
   await sub.unsubscribe();
  },
  
  async autoSubscribe() {
   if (!isSupported() || !AUTH.isLoggedIn()) return;
   if (notifPermission() !== 'granted') return; 
   
   const [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
   if (!reg || !vapidKey) return;
   
   const existing = await reg.pushManager.getSubscription();
   try {
    if (!existing) {
     const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
     });
     await saveSubscription(sub);
    } else {
     await saveSubscription(existing);
    }
   } catch {}
  },
  
  showPrompt() {
   if (!isSupported() || notifPermission() !== 'default') return;
   if (document.getElementById('push-notification-banner')) return; // Check for duplicates
   
   const banner = document.createElement('div');
   banner.id = 'push-notification-banner';
   banner.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        background:#0a1122;border-radius:12px;padding:16px 20px;
        align-items:center;gap:16px;box-shadow:0 10px 30px rgba(0,0,0,0.7);
        z-index:999999;width:90%;max-width:400px;border:1px solid #1e293b;
        display:flex;
      `;
   banner.innerHTML = `
        <div style="font-size: 24px;">🔔</div>
        <div style="flex: 1;">
          <h4 style="margin: 0; color: #fff; font-size: 15px; font-family: 'Jost', sans-serif; font-weight: 600;">Enable notifications</h4>
          <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px; font-family: 'Jost', sans-serif;">Get order updates instantly</p>
        </div>
        <button id="push-yes" style="background: #00d2ff; color: #000; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: 'Jost', sans-serif; transition: 0.2s;">Allow</button>
        <button id="push-no" style="background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; padding: 0;">✕</button>
      `;
   document.body.appendChild(banner);
   
   document.getElementById('push-yes').addEventListener('click', async () => {
    banner.remove();
    const success = await PUSH.subscribe();
    if (success && typeof showToast === 'function') {
      showToast('Notifications Enabled!', 'success');
    }
   });
   
   document.getElementById('push-no').addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('push_dismissed', '1');
   });
  },
  
  async init() {
   if (!AUTH.isLoggedIn()) return; 
   
   const run = async () => {
    await this.autoSubscribe();
    
    const path = window.location.pathname;
    const isHome = path === '/' || path.endsWith('index.html');
    
    // Only show the UI prompt on the home page if dismissed status is empty
    if (isHome && notifPermission() === 'default' && !sessionStorage.getItem('push_dismissed')) {
     setTimeout(() => this.showPrompt(), 3000);
    }
   };
   
   if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 5000 });
   } else {
    setTimeout(run, 1000);
   }
  },
 };
})();

window.addEventListener('auth:login', () => PUSH.init());
window.addEventListener('auth:logout', () => PUSH.unsubscribe());

if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', () => PUSH.init());
} else {
 PUSH.init();
}
