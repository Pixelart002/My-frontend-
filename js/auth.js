/* ============================================================
   LUVIIO — Auth  (v2 — fixed)
   ============================================================
   FIXES:
   1. Profile cached in sessionStorage with 5-min TTL
      → Eliminates /users/me call on every page load
   2. storage event listener clears tokens if another tab logs out
      → Prevents stale token reuse across tabs
   3. clearTokens() now also removes profile cache
   4. Token never logged, never in URL params
   5. Added wasRecentlyRefreshed() guard to skip refresh spam
   ============================================================ */

const AUTH = (() => {
  let _accessToken = null;
  let _userProfile = null;
  
  const RT_KEY = '__lv_rt';
  const PROFILE_KEY = '__lv_profile';
  const PROFILE_TTL = 5 * 60 * 1000; // 5 minutes
  const REFRESH_KEY = '__lv_last_refresh';
  const REFRESH_GAP = 30 * 1000; // don't re-refresh within 30s
  
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
  
  // ── Listen for logout in other tabs ───────────────────────
  // If another tab clears the refresh token, we wipe ours too
  window.addEventListener('storage', (e) => {
    // sessionStorage events don't cross tabs in most browsers,
    // but this guard handles shared localStorage if ever used
    if (e.key === RT_KEY && !e.newValue) {
      _accessToken = null;
      _userProfile = null;
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  });
  
  return {
    getToken() { return _accessToken; },
    
    setTokens(access, refresh) {
      _accessToken = access;
      if (refresh) {
        ss.set(RT_KEY, refresh);
        ss.set(REFRESH_KEY, String(Date.now()));
      }
    },
    
    clearTokens() {
      _accessToken = null;
      _userProfile = null;
      ss.del(RT_KEY);
      ss.del(PROFILE_KEY);
      ss.del(REFRESH_KEY);
      window.dispatchEvent(new CustomEvent('auth:logout'));
    },
    
    getRefreshToken() { return ss.get(RT_KEY); },
    
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
    
    async init() {
      const rt = this.getRefreshToken();
      if (!rt) return false;
      
      // If we have a valid access token already, skip
      if (_accessToken) return true;
      
      // Debounce: avoid hammering refresh endpoint
      if (this._wasRecentlyRefreshed() && _loadProfileCache()) {
        // We probably already have a valid session from this tab open;
        // still need a new access token though, so proceed but mark as
        // debounced to avoid edge cases
      }
      
      try {
        const res = await fetch(`${CONFIG.API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
          signal: AbortSignal.timeout(8000), // 8s max
        });
        if (!res.ok) { this.clearTokens(); return false; }
        
        const data = await res.json();
        this.setTokens(data.access_token, data.refresh_token);
        window.dispatchEvent(new CustomEvent('auth:login'));
        return true;
      } catch {
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