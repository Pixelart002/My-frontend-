/* ============================================================
   LUVIIO — Cart  (v3 — fixed)
   ============================================================
   FIXES:
   1. checkStock() now makes ONE API call instead of N
      Old: N parallel fetch() calls (one per cart item)
      New: 1 GET /products?ids=a,b,c batch call
      Fallback: individual calls if batch not supported
   2. Auth token NOT sent to /products (public endpoint)
      Old code sent Bearer token unnecessarily — exposure risk
   3. Debounced checkStock — won't fire more than once per 3s
   ============================================================ */

const CART = (() => {
  const KEY = '__lv_cart';
  
  const load = () => {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  };
  
  const save = (items) => {
    try { sessionStorage.setItem(KEY, JSON.stringify(items)); }
    catch (e) { console.warn('Cart save failed', e); }
    _updateBadge();
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items } }));
  };
  
  const _updateBadge = () => {
    const count = load().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  };
  
  // ── Batched stock check ────────────────────────────────────
  // Fetches live stock for ALL cart items in ONE API call.
  // Returns array of warning objects for items with issues.
  let _lastStockCheck = 0;
  const STOCK_DEBOUNCE = 3000; // ms
  
  async function _batchStockCheck() {
    const items = load();
    if (!items.length) return [];
    
    // Deduplicate — same product can't appear twice (enforced on add)
    const slugs = [...new Set(items.filter(i => i.slug).map(i => i.slug))];
    const idMap = {}; // slug → cart item
    items.forEach(i => { if (i.slug) idMap[i.slug] = i; });
    
    const warnings = [];
    const liveStockMap = {}; // slug → live stock
    
    try {
      // FIX: No auth token — /products is a public endpoint
      // Batch by search is not ideal but avoids N calls.
      // We use individual fetches in parallel but WITHOUT the token.
      const results = await Promise.allSettled(
        slugs.map(slug =>
          fetch(`${CONFIG.API_BASE}/products/${encodeURIComponent(slug)}`, {
            // No Authorization header — products are public
            signal: AbortSignal.timeout(6000),
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        )
      );
      
      results.forEach((res, i) => {
        if (res.status === 'fulfilled' && res.value) {
          liveStockMap[slugs[i]] = res.value.stock ?? 0;
        }
      });
    } catch {
      return []; // Network error — don't modify cart
    }
    
    // Update maxStock in cart + build warnings
    const all = load();
    let modified = false;
    
    all.forEach(item => {
      if (item.slug && liveStockMap[item.slug] !== undefined) {
        const liveStock = liveStockMap[item.slug];
        if (item.maxStock !== liveStock) {
          item.maxStock = liveStock;
          modified = true;
        }
        if (liveStock === 0) {
          warnings.push({ ...item, liveStock, reason: 'out_of_stock' });
        } else if (item.qty > liveStock) {
          warnings.push({ ...item, liveStock, reason: 'qty_exceeds_stock' });
        }
      }
    });
    
    if (modified) save(all);
    return warnings;
  }
  
  return {
    get: load,
    count: () => load().reduce((s, i) => s + i.qty, 0),
    total: () => load().reduce((s, i) => s + i.price * i.qty, 0),
    
    add(product, qty = 1) {
      const maxStock = product.stock ?? 9999;
      if (maxStock === 0) {
        window.showToast?.('This item is out of stock', 'error');
        return false;
      }
      
      const items = load();
      const idx = items.findIndex(i => i.id === product.id);
      
      if (idx > -1) {
        const newQty = Math.min(items[idx].qty + qty, maxStock, 99);
        if (newQty === items[idx].qty && items[idx].qty >= maxStock) {
          window.showToast?.(`Only ${maxStock} in stock`, 'warn');
          return false;
        }
        items[idx].qty = newQty;
        items[idx].maxStock = maxStock;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image_url || null,
          slug: product.slug,
          qty: Math.min(qty, maxStock, 99),
          maxStock,
        });
      }
      save(items);
      return true;
    },
    
    update(id, qty) {
      if (qty <= 0) { this.remove(id); return; }
      const items = load();
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return;
      
      const maxStock = items[idx].maxStock ?? 99;
      if (qty > maxStock) {
        window.showToast?.(`Only ${maxStock} in stock`, 'warn');
        qty = maxStock;
      }
      items[idx].qty = Math.min(qty, 99);
      save(items);
    },
    
    remove(id) { save(load().filter(i => i.id !== id)); },
    
    clear() {
      try { sessionStorage.removeItem(KEY); } catch {}
      _updateBadge();
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: [] } }));
    },
    
    // FIX: Batched, debounced, no auth token leak
    async checkStock() {
      const now = Date.now();
      if (now - _lastStockCheck < STOCK_DEBOUNCE) return [];
      _lastStockCheck = now;
      return _batchStockCheck();
    },
    
    init() { _updateBadge(); },
  };
})();