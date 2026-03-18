/* ============================================================
   LUVIIO — Cart
   Cart items are product IDs + quantities — NOT sensitive data.
   sessionStorage is acceptable here (tab-scoped, cleared on close).
   Access tokens are NEVER stored here.
   ============================================================ */

const CART = (() => {
  const KEY = '__lv_cart';

  function load() {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function save(items) {
    try { sessionStorage.setItem(KEY, JSON.stringify(items)); }
    catch (e) { console.warn('Cart save failed', e); }
    updateBadge();
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items } }));
  }

  function updateBadge() {
    const count = total.count();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  const total = {
    count: () => load().reduce((s, i) => s + i.qty, 0),
    price: () => load().reduce((s, i) => s + i.price * i.qty, 0),
  };

  return {
    get:   load,
    count: total.count,
    total: total.price,

    add(product, qty = 1) {
      const items = load();
      const idx = items.findIndex(i => i.id === product.id);
      if (idx > -1) {
        items[idx].qty = Math.min(items[idx].qty + qty, 99);
      } else {
        items.push({
          id:    product.id,
          name:  product.name,
          price: product.price,
          image: product.image_url || null,
          slug:  product.slug,
          qty,
        });
      }
      save(items);
    },

    remove(id) {
      save(load().filter(i => i.id !== id));
    },

    update(id, qty) {
      if (qty <= 0) { this.remove(id); return; }
      const items = load();
      const idx = items.findIndex(i => i.id === id);
      if (idx > -1) { items[idx].qty = Math.min(qty, 99); save(items); }
    },

    clear() {
      try { sessionStorage.removeItem(KEY); } catch {}
      updateBadge();
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: [] } }));
    },

    init() { updateBadge(); },
  };
})();
