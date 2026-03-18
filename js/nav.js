/* ============================================================
   LUVIIO — Nav  (injected into every page)
   ============================================================ */

const NAV = {
  inject() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    nav.innerHTML = `
      <div class="nav-inner">
        <!-- Logo -->
        <a href="/index.html" class="nav-logo">LUVIIO</a>

        <!-- Desktop links -->
        <div class="nav-links">
          <a href="/shop.html">Shop</a>
          <a href="/shop.html?category=new">New Arrivals</a>
          <a href="/orders.html" data-authed style="display:none">My Orders</a>
        </div>

        <!-- Actions -->
        <div class="nav-actions">
          <!-- Cart -->
          <a href="/cart.html" class="nav-icon-btn" aria-label="Cart">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span data-cart-count class="cart-badge" style="display:none">0</span>
          </a>

          <!-- Guest: Login -->
          <a href="/login.html" class="btn-ghost" data-guest>Login</a>

          <!-- Authed: User dropdown -->
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

        <!-- Mobile toggle -->
        <button class="mobile-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      <!-- Mobile menu -->
      <div class="mobile-menu">
        <a href="/shop.html">Shop</a>
        <a href="/shop.html?category=new">New Arrivals</a>
        <a href="/orders.html" data-authed style="display:none">My Orders</a>
        <a href="/profile.html" data-authed style="display:none">Profile</a>
        <a href="/login.html" data-guest>Login</a>
        <button id="logout-btn-mobile" class="logout-btn" data-authed style="display:none">Sign out</button>
      </div>
    `;

    this._bindEvents();
    CART.init();
    AUTH.updateNavUI();
  },

  _bindEvents() {
    // Mobile toggle
    const toggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    toggle?.addEventListener('click', () => {
      mobileMenu?.classList.toggle('open');
      toggle.classList.toggle('open');
    });

    // Close mobile menu on link click
    document.querySelectorAll('.mobile-menu a').forEach(a => {
      a.addEventListener('click', () => mobileMenu?.classList.remove('open'));
    });

    // User dropdown
    const uToggle = document.querySelector('.user-menu-toggle');
    const uDrop   = document.querySelector('.user-dropdown');
    uToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      uDrop?.classList.toggle('open');
    });
    document.addEventListener('click', () => uDrop?.classList.remove('open'));

    // Logout
    async function doLogout() {
      try { await API.logout(); } catch {}
      AUTH.clearTokens();
      CART.clear();
      window.location.href = '/index.html';
    }

    document.getElementById('logout-btn')?.addEventListener('click', doLogout);
    document.getElementById('logout-btn-mobile')?.addEventListener('click', doLogout);

    // Auth events
    window.addEventListener('auth:login',  () => AUTH.updateNavUI());
    window.addEventListener('auth:logout', () => AUTH.updateNavUI());
  },
};

/* ── Page init — runs on every page ────────────────────── */
async function pageInit(opts = {}) {
  NAV.inject();

  const loggedIn = await AUTH.init();

  if (loggedIn) {
    try {
      const profile = await API.getMe();
      AUTH.setProfile(profile);
      AUTH.updateNavUI();
    } catch {}
  }

  if (opts.requireAuth && !AUTH.isLoggedIn()) {
    AUTH.requireAuth();
    return false;
  }

  return true;
}
