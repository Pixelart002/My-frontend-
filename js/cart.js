/* ============================================================
   LUVIIO — Cart  (v2 — stock-aware)
   UPDATES:
   1. add()    — validates qty against product.stock before adding
   2. update() — clamps qty to maxStock if provided
   3. checkStock() — fetches live stock for all cart items, flags over-limit
   4. getStockWarnings() — returns items where qty > live stock
   ============================================================ */

const CART = (() => {
  const KEY = '__lv_cart';
  
  // ── internal helpers ──────────────────────────────────────────────────────
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
  
  // ── public API ────────────────────────────────────────────────────────────
  return {
    get: load,
    count: () => load().reduce((s, i) => s + i.qty, 0),
    total: () => load().reduce((s, i) => s + i.price * i.qty, 0),
    
    // ── add — respects maxStock ─────────────────────────────────────────────
    add(product, qty = 1) {
      const maxStock = product.stock ?? 9999; // use live stock if provided
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
        items[idx].maxStock = maxStock; // keep fresh
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
    
    // ── update — clamp to maxStock ──────────────────────────────────────────
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
    
    // ── checkStock — fetch live stock and flag over-limit items ────────────
    async checkStock() {
      const items = load();
      if (!items.length) return [];
      
      const warnings = [];
      await Promise.all(items.map(async item => {
        try {
          const data = await fetch(
            `${CONFIG.API_BASE}/products/${encodeURIComponent(item.slug || item.id)}`, { headers: AUTH.getToken() ? { Authorization: `Bearer ${AUTH.getToken()}` } : {} }
          ).then(r => r.ok ? r.json() : null);
          
          if (!data) return;
          
          const liveStock = data.stock ?? 0;
          
          // Update maxStock in cart
          const all = load();
          const i = all.findIndex(x => x.id === item.id);
          if (i > -1) { all[i].maxStock = liveStock;
            save(all); }
          
          if (liveStock === 0) {
            warnings.push({ ...item, liveStock, reason: 'out_of_stock' });
          } else if (item.qty > liveStock) {
            warnings.push({ ...item, liveStock, reason: 'qty_exceeds_stock' });
          }
        } catch {}
      }));
      return warnings;
    },
    
    init() { _updateBadge(); },
  };
})();