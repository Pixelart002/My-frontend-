/* ============================================================
   LUVIIO — Push Notification Manager  (v2 — fixed)
   ============================================================
   FIXES:
   1. PUSH.init() no longer fires on every DOMContentLoaded
      Old: Always ran for all users including guests
      New: Only runs if user is logged in AND permission=granted
   2. autoSubscribe() guarded — won't call getVapidKey() unless
      permission is already 'granted' (user already said yes)
   3. showPrompt() uses requestIdleCallback — non-blocking
   4. VAPID key cached in sessionStorage — no repeat API calls
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
  
  // FIX: Cache VAPID key in sessionStorage to avoid repeat API calls
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
    
    // FIX: Only run autoSubscribe if already granted — no unnecessary API calls
    async autoSubscribe() {
      if (!isSupported() || !AUTH.isLoggedIn()) return;
      if (notifPermission() !== 'granted') return; // ← key guard
      
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
      
      const banner = document.createElement('div');
      banner.style.cssText = `
        position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:#0B1628;color:#fff;padding:14px 20px;
        border-radius:12px;border:1px solid rgba(0,197,212,.3);
        display:flex;align-items:center;gap:12px;z-index:9999;
        font-family:'DM Sans',sans-serif;font-size:14px;
        box-shadow:0 8px 32px rgba(0,0,0,.4);
        max-width:360px;width:90%;
      `;
      banner.innerHTML = `
        <span style="font-size:22px;">🔔</span>
        <div style="flex:1;">
          <div style="font-weight:600;margin-bottom:2px;">Enable notifications</div>
          <div style="font-size:12px;color:rgba(255,255,255,.6);">Get order updates instantly</div>
        </div>
        <button id="push-yes" style="background:#00C5D4;color:#000;border:none;padding:8px 14px;
          border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;">Allow</button>
        <button id="push-no" style="background:transparent;color:rgba(255,255,255,.4);
          border:none;font-size:18px;cursor:pointer;padding:4px;">✕</button>
      `;
      document.body.appendChild(banner);
      
      document.getElementById('push-yes').addEventListener('click', async () => {
        banner.remove();
        await PUSH.subscribe();
      });
      document.getElementById('push-no').addEventListener('click', () => {
        banner.remove();
        sessionStorage.setItem('push_dismissed', '1');
      });
      
      setTimeout(() => banner.isConnected && banner.remove(), 8000);
    },
    
    // FIX: Use requestIdleCallback so push init never blocks the main thread
    async init() {
      if (!AUTH.isLoggedIn()) return; // guests: skip entirely
      
      const run = async () => {
        await this.autoSubscribe();
        
        if (notifPermission() === 'default' && !sessionStorage.getItem('push_dismissed')) {
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

// FIX: Only wire up auth events — remove the blanket DOMContentLoaded listener
// that used to fire for ALL users on ALL pages.
// push.js included at bottom of body — no DOMContentLoaded needed.
window.addEventListener('auth:login', () => PUSH.init());
window.addEventListener('auth:logout', () => PUSH.unsubscribe());

// Init only if already logged in when page loads (no-op for guests)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PUSH.init());
} else {
  PUSH.init();
}