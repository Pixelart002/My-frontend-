/* ============================================================
   LUVIIO — Nav  (v10 — Single Banner Only for Home Page)
   ============================================================ */

const NAV = {
  inject() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    // 🔥 PAGE CHECKER LOGIC: Only show banner on Home Page
    const path = window.location.pathname;
    let bannerHTML = '';

    // Check if we are on root (/) or index.html
    if (path === '/' || path.endsWith('index.html')) {
      bannerHTML = `
        <div id="notification-banner" style="display: none; position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #0a1122; border-radius: 12px; padding: 16px 20px; align-items: center; gap: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); z-index: 99999; width: 90%; max-width: 400px; border: 1px solid #1e293b;">
          <div style="font-size: 24px;">🔔</div>
          <div style="flex: 1;">
            <h4 style="margin: 0; color: #fff; font-size: 15px; font-family: 'Jost', sans-serif; font-weight: 600;">Enable notifications</h4>
            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px; font-family: 'Jost', sans-serif;">Get order updates instantly</p>
          </div>
          <button id="btn-allow-push" onclick="enableNotifications()" style="background: #00d2ff; color: #000; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-family: 'Jost', sans-serif; transition: 0.2s;">Allow</button>
          <button id="btn-close-push" onclick="document.getElementById('notification-banner').style.display='none'" style="background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; padding: 0;">✕</button>
        </div>
      `;
    }
    
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

      ${bannerHTML} 
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
    document.querySelectorAll('.mobile-menu a').forEach(a => {
      a.addEventListener('click', () => mobileMenu?.classList.remove('open'));
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

    // Display logic for the banner (if it exists on this page)
    const banner = document.getElementById('notification-banner');
    if (banner) {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        if (Notification.permission === 'default') {
          banner.style.display = 'flex';
        }
      }
    }
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
        } catch (e) {
          console.warn("Could not fetch profile:", e);
        }
      } 
      else {
        setTimeout(async () => {
          try {
            const profile = await API.getMe();
            AUTH.setProfile(profile);
          } catch {}
        }, 2000);
      }
    }
    
    if (opts.requireAuth && !loggedIn) {
      AUTH.requireAuth();
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn("pageInit Auth Check Failed safely:", error);
    return false;
  }
}
