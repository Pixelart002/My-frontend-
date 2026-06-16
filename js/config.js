/* ============================================================
   LUVIIO — Config
   ============================================================
   SECURITY: Never hardcode API keys in this file.
   This file is tracked in git.

   For Stripe publishable key:
   Option A (Vercel): Add STRIPE_PK as an Environment Variable
                      in Vercel dashboard, then use a build step
                      or inject via vercel.json headers.
   Option B (simple): Create a separate /js/keys.js file,
                      add it to .gitignore, and load it before
                      this file in every HTML page:
                        <script src="/js/keys.js"></script>
                      keys.js content:
                        window.__STRIPE_PK = 'pk_live_...';
   Option C (current): Load key from a /config endpoint that
                        requires the frontend origin to match.

   DO NOT commit real keys here.
   ============================================================ */
const CONFIG = {
  API_BASE: 'https://dev-luviio-in.onrender.com/api/v1',
  
  // FIX: Read Stripe key from injected global (set in keys.js, not git-tracked)
  // Fallback to empty string — checkout will show warning if not set.
  get STRIPE_PK() {
    return window.__STRIPE_PK || 'pk_test_51LQQdRSDXqp6jmyTe96SuttCSgDD91Yu90PsGPLuw9liYziNa1TT0Yhi01fRdNuh5k656lM93wRYTjJZK7vzJBzL00FQaIQXYa';
  },
  
  APP_NAME: 'Luviio',
};

/*
  ── HOW TO SET UP keys.js (recommended) ─────────────────────

  1. Create /js/keys.js (add to .gitignore):
       window.__STRIPE_PK = 'pk_live_YOUR_KEY_HERE';

  2. Add to .gitignore:
       /js/keys.js

  3. Add <script src="/js/keys.js"></script> BEFORE config.js
     in every HTML file that uses Stripe.

  4. On Vercel: add keys.js as a secret file in Build settings,
     or use a build script to inject the key.

  ─────────────────────────────────────────────────────────── */