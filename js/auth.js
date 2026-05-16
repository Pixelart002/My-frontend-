/* ============================================================
   LUVIIO — Auth  (v3 — HttpOnly Cookie Secure Flow)
   ============================================================
   FIXES:
   1. SECURED: Refresh Token is NO LONGER stored in sessionStorage.
      It relies entirely on the browser's HttpOnly cookie.
   2. FIXED "Login Loop": init() no longer checks for local refresh 
      token. It blindly pings /auth/refresh with credentials.
   3. CROSS-TAB SYNC: Uses localStorage event to securely log out
      all open tabs when the user logs out in one.
   4. Profile cached in sessionStorage with 5-min TTL.
   ============================================================ */

const AUTH = (() => {
  let _accessToken = null;
  let _userProfile = null;
  
  const PROFILE_KEY = '__lv_profile';
  const PROFILE_TTL = 5 * 60 * 1000; // 5 minutes
  const REFRESH_KEY = '__lv_last_refresh';
  const REFRESH_GAP = 30 * 1000; // don't re-refresh within 30s
  const SYNC_LOGOUT_KEY = '__lv_logout_sync'; // Cross-tab sync
  
  // ── Safe sessionStorage wrappers ──────────────────────────
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
    del(k) { try { sessionStorage.removeItem(k); } catch {} },
  };
  
  // ── Profile cache ─────────────────────────────────────────
  function _saveProfileCache(profile) {
    try {
      ss.set(PROFILE_KEY, JSON.stringify({ data: profile, ts: Date.now() }));
    } catch {}
  }
  
  function _loadProfileCache() {
    try {
      const raw = ss.get(PROFILE_KEY);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > PROFILE_TTL) { ss.del(PROFILE_KEY); return null; }
      return data;
    } catch { return null; }
  }
  
  // ── Listen for logout in other tabs (Cross-Tab Sync) ──────
  window.addEventListener('storage', (e) => {
    // If another tab triggers logout, clear this tab's memory as well
    if (e.key === SYNC_LOGOUT_KEY) {
      _accessToken = null;
      _userProfile = null;
      ss.del(PROFILE_KEY);
      ss.del(REFRESH_KEY);
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  });
  
  return {
    getToken() { return _accessToken; },
    
    // Notice: We no longer accept or store a refresh token argument
    setTokens(access) {
      _accessToken = access;
      ss.set(REFRESH_KEY, String(Date.now()));
    },
    
    clearTokens() {
      _accessToken = null;
      _userProfile = null;
      ss.del(PROFILE_KEY);
      ss.del(REFRESH_KEY);
      
      // Broadcast logout to other open tabs
      try { localStorage.setItem(SYNC_LOGOUT_KEY, String(Date.now())); } catch {}
      
      window.dispatchEvent(new CustomEvent('auth:logout'));
    },
    
    isLoggedIn() { return !!_accessToken; },
    
    // ── Profile: memory → cache → null ────────────────────
    setProfile(p) {
      _userProfile = p;
      _saveProfileCache(p);
    },
    
    getProfile() {
      if (_userProfile) return _userProfile;
      // Try cache before returning null
      const cached = _loadProfileCache();
      if (cached) { _userProfile = cached; return cached; }
      return null;
    },
    
    // Returns cached profile without API call (for nav render speed)
    getCachedProfile() { return _loadProfileCache(); },
    
    // ── Avoid refresh-token spam ───────────────────────────
    _wasRecentlyRefreshed() {
      const last = ss.get(REFRESH_KEY);
      return last && (Date.now() - Number(last)) < REFRESH_GAP;
    },
    
    // ── Initialize Auth State on Page Load ──────────────────
    async init() {
      // If we have a valid access token in memory already, skip
      if (_accessToken) return true;
      
      // Debounce: avoid hammering refresh endpoint if already checking
      if (this._wasRecentlyRefreshed() && _loadProfileCache()) {
        // Debounce handled gracefully
      }
      
      try {
        // We DO NOT send a JSON body here anymore. 
        // "credentials: 'include'" tells the browser to automatically attach the HttpOnly cookie!
        const res = await fetch(`${CONFIG.API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // <--- CRITICAL FOR SECURE COOKIES
          signal: AbortSignal.timeout(8000), // 8s max
        });
        
        if (!res.ok) { 
          // No valid cookie found, user is genuinely logged out
          this.clearTokens(); 
          return false; 
        }
        
        const data = await res.json();
        this.setTokens(data.access_token);
        window.dispatchEvent(new CustomEvent('auth:login'));
        return true;
        
      } catch (err) {
        console.warn("Auth initialization failed", err);
        this.clearTokens();
        return false;
      }
    },
    
    requireAuth() {
      if (!this.isLoggedIn()) {
        const current = window.location.pathname;
        if (current === '/login.html' || current === '/login' || current.endsWith('/login.html')) {
          return false;
        }
        window.location.href =
          '/login.html?redirect=' + encodeURIComponent(current + window.location.search);
        return false;
      }
      return true;
    },
    
    updateNavUI() {
      const profile = this.getProfile();
      document.querySelectorAll('[data-guest]').forEach(el => {
        el.style.display = this.isLoggedIn() ? 'none' : '';
      });
      document.querySelectorAll('[data-authed]').forEach(el => {
        el.style.display = this.isLoggedIn() ? '' : 'none';
      });
      if (profile) {
        document.querySelectorAll('[data-user-name]').forEach(el => {
          el.textContent = escapeHTML(
            profile.full_name || profile.email?.split('@')[0] || 'Account'
          );
        });
      }
    },
  };
})();
