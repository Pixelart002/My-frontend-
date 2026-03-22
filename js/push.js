/* ============================================================
   LUVIIO — Push Notification Manager
   Include after nav.js on every page:
   <script src="/js/push.js"></script>
   ============================================================ */

const PUSH = (() => {
 const SW_URL = '/sw.js';
 
 // ── urlBase64ToUint8Array — converts VAPID public key ──────────────────────
 const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
 };
 
 // ── Check browser support ──────────────────────────────────────────────────
 const isSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
 
 // ── Register service worker ────────────────────────────────────────────────
 const registerSW = async () => {
  if (!isSupported()) return null;
  try {
   return await navigator.serviceWorker.register(SW_URL);
  } catch (e) {
   console.warn('[PUSH] SW registration failed:', e);
   return null;
  }
 };
 
 // ── Get VAPID key from backend ─────────────────────────────────────────────
 const getVapidKey = async () => {
  try {
   const r = await fetch(`${CONFIG.API_BASE}/push/vapid-key`);
   if (!r.ok) return null;
   const d = await r.json();
   return d.public_key || null;
  } catch {
   return null;
  }
 };
 
 // ── Save subscription to backend ───────────────────────────────────────────
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
   });
  } catch (e) {
   console.warn('[PUSH] Save subscription failed:', e);
  }
 };
 
 // ── Remove subscription from backend ──────────────────────────────────────
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
   });
  } catch {}
 };
 
 return {
  isSupported,
  
  // ── Request permission + subscribe ────────────────────────────────────────
  async subscribe() {
   if (!isSupported()) {
    console.warn('[PUSH] Not supported in this browser');
    return false;
   }
   if (!AUTH.isLoggedIn()) return false;
   
   const permission = await Notification.requestPermission();
   if (permission !== 'granted') {
    console.info('[PUSH] Permission denied by user');
    return false;
   }
   
   const [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
   if (!reg || !vapidKey) {
    console.warn('[PUSH] SW or VAPID key missing');
    return false;
   }
   
   try {
    const subscription = await reg.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    await saveSubscription(subscription);
    console.info('[PUSH] Subscribed ✓');
    return true;
   } catch (e) {
    console.error('[PUSH] Subscribe failed:', e);
    return false;
   }
  },
  
  // ── Unsubscribe ────────────────────────────────────────────────────────────
  async unsubscribe() {
   if (!isSupported()) return;
   const reg = await navigator.serviceWorker.getRegistration(SW_URL);
   if (!reg) return;
   const sub = await reg.pushManager.getSubscription();
   if (!sub) return;
   await removeSubscription(sub);
   await sub.unsubscribe();
   console.info('[PUSH] Unsubscribed');
  },
  
  // ── Auto-subscribe when user logs in ──────────────────────────────────────
  async autoSubscribe() {
   if (!isSupported() || !AUTH.isLoggedIn()) return;
   const permission = Notification.permission;
   if (permission === 'granted') {
    // Already granted — silently subscribe in background
    const [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
    if (!reg || !vapidKey) return;
    const existing = await reg.pushManager.getSubscription();
    if (!existing) {
     // Subscribe silently
     try {
      const sub = await reg.pushManager.subscribe({
       userVisibleOnly: true,
       applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await saveSubscription(sub);
     } catch {}
    } else {
     // Refresh subscription in backend (in case it expired)
     await saveSubscription(existing);
    }
   }
   // If 'default' — don't auto-prompt, wait for user action
   // If 'denied' — nothing we can do
  },
  
  // ── Show prompt UI (call from profile page or after first order) ──────────
  showPrompt() {
   if (!isSupported()) return;
   if (Notification.permission !== 'default') return;
   // Show a friendly in-app prompt before the browser one
   const banner = document.createElement('div');
   banner.style.cssText = `
        position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:#0B1628;color:#fff;padding:14px 20px;
        border-radius:12px;border:1px solid rgba(0,197,212,.3);
        display:flex;align-items:center;gap:12px;z-index:9999;
        font-family:'DM Sans',sans-serif;font-size:14px;
        box-shadow:0 8px 32px rgba(0,0,0,.4);
        animation:slideUp .3s ease;max-width:360px;width:90%;
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
   
   // Auto-dismiss after 8s
   setTimeout(() => banner.isConnected && banner.remove(), 8000);
  },
  
  // ── Init — call on every page ─────────────────────────────────────────────
  async init() {
   await this.autoSubscribe();
   
   // Show prompt once per session if not dismissed
   if (AUTH.isLoggedIn() &&
    Notification.permission === 'default' &&
    !sessionStorage.getItem('push_dismissed')) {
    // Small delay so page loads first
    setTimeout(() => this.showPrompt(), 3000);
   }
  },
 };
})();

// ── Auto-init when user logs in ───────────────────────────────────────────────
window.addEventListener('auth:login', () => PUSH.init());
window.addEventListener('auth:logout', () => PUSH.unsubscribe());

// ── Init on page load ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => PUSH.init());