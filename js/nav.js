/* ============================================================
   LUVIIO — Nav  (v6 — Synced with push.js perfectly)
   ============================================================ */

const NAV = {
  inject() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    
    nav.innerHTML = `
      <div class="nav-inner">
        <a href="/index.html" class="nav-logo">LUVIIO</a>
        <div class="nav-links">
          <a href="/shop.html">Shop</a>
          <a href="/shop.html?category=new">New Arrivals</a>
          <a href="/orders.html" data-authed style="display:none">My Orders</a>
        </div>
        <div class="nav-actions">
          <a href="/cart.html" class="nav-icon-btn" aria-label="Cart">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span data-cart-count class="cart-badge" style="display:none">0</span>
          </a>
          <a href="/login.html" class="btn-ghost" data-guest>Login</a>
          <div class="user-menu" data-authed style="display:none">
            <button class="nav-icon-btn user-menu-toggle" aria-label="Account">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span data-user-name class="user-name">Account</span>
            </button>
            <div class="user-dropdown">
              <a href="/profile.html">Profile</a>
              <a href="/orders.html">Orders</a>
              <button id="logout-btn" class="logout-btn">Sign out</button>
            </div>
          </div>
        </div>
        <button class="mobile-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="mobile-menu">
        <a href="/shop.html">Shop</a>
        <a href="/shop.html?category=new">New Arrivals</a>
        <a href="/orders.html" data-authed style="display:none">My Orders</a>
        <a href="/profile.html" data-authed style="display:none">Profile</a>
        <a href="/login.html" data-guest>Login</a>
        <button id="logout-btn-mobile" class="logout-btn" data-authed style="display:none">Sign out</button>
      </div>

      <div id="notification-banner" style="display: none; position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #0a0a0a; border-radius: 8px; padding: 16px 20px; align-items: center; gap: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); z-index: 99999; width: 90%; max-width: 420px; border: 1px solid #222222;">
        <div style="color: #c9a55e; display: flex; align-items: center; justify-content: center;">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </div>
        <div style="flex: 1;">
          <h4 style="margin: 0; color: #f4f0ea; font-size: 13px; font-family: 'Jost', sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Enable Notifications</h4>
          <p style="margin: 4px 0 0; color: #8c8881; font-size: 13px; font-family: 'Jost', sans-serif;">Get exclusive updates and order tracking.</p>
        </div>
        <button id="btn-allow-push" style="background: #c9a55e; color: #000; border: none; padding: 10px 18px; border-radius: 4px; font-weight: 600; cursor: pointer; font-family: 'Jost', sans-serif; text-transform: uppercase; letter-spacing: 1px; font-size: 11px;">Allow</button>
        <button id="btn-close-push" style="background: none; border: none; color: #8c8881; font-size: 20px; cursor: pointer; padding: 0;">✕</button>
      </div>
    `;
    
    this._bindEvents();
    CART.init();
    AUTH.updateNavUI();
  },
  
  _bindEvents() {
    const toggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    toggle?.addEventListener('click', () => {
      mobileMenu?.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    
    const uToggle = document.querySelector('.user-menu-toggle');
    const uDrop = document.querySelector('.user-dropdown');
    uToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      uDrop?.classList.toggle('open');
    });
    document.addEventListener('click', () => uDrop?.classList.remove('open'));
    
    async function doLogout() {
      try { await API.logout(); } catch {}
      AUTH.clearTokens();
      CART.clear();
      window.location.href = '/index.html';
    }
    document.getElementById('logout-btn')?.addEventListener('click', doLogout);
    document.getElementById('logout-btn-mobile')?.addEventListener('click', doLogout);
    
    window.addEventListener('auth:login', () => AUTH.updateNavUI());
    window.addEventListener('auth:logout', () => AUTH.updateNavUI());

    // 🔔 SYNCED PUSH BUTTONS LOGIC
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'btn-allow-push') {
        const btn = e.target;
        btn.textContent = 'Wait...'; // Show loading
        
        if (typeof PUSH !== 'undefined' && typeof PUSH.subscribe === 'function') {
          const success = await PUSH.subscribe();
          const banner = document.getElementById('notification-banner');
          if (banner) banner.style.display = 'none';
          
          if (success && typeof showToast === 'function') {
            showToast('Notifications Enabled!', 'success');
          } else if (!success && typeof showToast === 'function') {
            showToast('Permission denied or failed.', 'error');
          }
        } else {
          console.error("PUSH module missing.");
        }
      }
      
      if (e.target.id === 'btn-close-push') {
        const banner = document.getElementById('notification-banner');
        if (banner) banner.style.display = 'none';
        sessionStorage.setItem('push_dismissed', '1'); // User said no for now
      }
    });
  },
};

/* ── pageInit — runs on every page ─────────────────────────────────────────── */
async function pageInit(opts = {}) {
  NAV.inject();
  
  const cachedProfile = AUTH.getProfile();
  if (cachedProfile) {
    AUTH.setProfile(cachedProfile);
    AUTH.updateNavUI();
  }
  
  try {
    const loggedIn = await AUTH.init(); 
    
    if (loggedIn) {
      if (!cachedProfile) {
        try {
          const profile = await API.getMe();
          AUTH.setProfile(profile);
          AUTH.updateNavUI();
        } catch (e) {}
      } else {
        setTimeout(async () => {
          try {
            const profile = await API.getMe();
            AUTH.setProfile(profile);
          } catch {}
        }, 2000);
      }

      // 🔔 SHOW BANNER LOGIC (Only if logged in & not dismissed)
      const banner = document.getElementById('notification-banner');
      if (banner && 'Notification' in window && Notification.permission === 'default') {
        if (!sessionStorage.getItem('push_dismissed')) {
          setTimeout(() => { banner.style.display = 'flex'; }, 3000);
        }
      }
    }
    
    if (opts.requireAuth && !loggedIn) {
      AUTH.requireAuth();
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}
