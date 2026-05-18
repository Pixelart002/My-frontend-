/* ============================================================
   LUVIIO — API  (v6.1 — Auto-Retry + Direct Slash Fix)
   ============================================================
   FIXES INCLUDED:
   1. AUTO-RETRY (Cold Start Fix): Retries up to 2 times in background.
   2. LOOP TRAP FIXED: No infinite reload loops on 401.
   3. CROSS-DOMAIN COOKIE: 'include' strictly for /auth/ endpoints.
   4. SLASH FIX: Removed regex builder, using direct template literals.
   ============================================================ */

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

const API = (() => {
  // Public endpoints that don't need Authorization header
  const PUBLIC_PREFIXES = ['/products', '/categories', '/pricing/config', '/health', '/push/vapid-key'];
  
  function _isPublic(path) {
    return PUBLIC_PREFIXES.some(p => path.startsWith(p));
  }
  
  // 🔥 Retry Fix: Added 'retriesLeft' parameter to auto-try if server is sleeping
  async function request(method, path, body = null, isRetry = false, retriesLeft = 2) {
    const headers = {};
    const token = typeof AUTH !== 'undefined' ? AUTH.getToken() : null;
    
    // Don't send token to public endpoints (reduces exposure)
    if (token && !_isPublic(path)) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const opts = {
      method,
      headers,
      signal: AbortSignal.timeout(12000), // 12s timeout
    };

    // THE CRITICAL FIX: Accept cookies ONLY for Auth endpoints
    if (path.startsWith('/auth/')) {
      opts.credentials = 'include';
    }
    
    if (body !== null && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      // Let browser set multipart Content-Type with boundary
      opts.body = body;
    }
    
    let res;
    try {
      // 🔥 SLASH FIX: Direct concatenation — fast, simple, no regex breaking
      res = await fetch(`${CONFIG.API_BASE}${path}`, opts);
    } catch (networkErr) {
      // THE ASLI FIX: Agar request fail hui (e.g. server sleeping), 1 second ruk kar retry karo!
      if (retriesLeft > 0) {
        console.warn(`[API] Server wake-up delay. Retrying in background...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return request(method, path, body, isRetry, retriesLeft - 1);
      }

      if (networkErr.name === 'TimeoutError') {
        throw new APIError('Request timed out — please try again', 0);
      }
      throw new APIError('Network error — please check your connection', 0);
    }
    
    const isAuthEndpoint = path.startsWith('/auth/');
    
    // Auto-refresh on 401 — but NOT for auth endpoints (avoid loops)
    if (res.status === 401 && !isRetry && !isAuthEndpoint) {
      if (typeof AUTH !== 'undefined') {
        const refreshed = await AUTH.init();
        // Pass retriesLeft forward so refreshed request doesn't lose safety
        if (refreshed) return request(method, path, body, true, retriesLeft);
        
        // THE LOOP FIX: Sirf tokens clear karo, forcefully redirect mat karo!
        AUTH.clearTokens();
      }
      return null;
    }
    
    if (res.status === 204) return null;
    
    let data;
    try { data = await res.json(); } catch { data = {}; }
    
    if (!res.ok) {
      // Sanitize error — never expose internal server details
      const raw = Array.isArray(data?.detail) ?
        data.detail.map(d => d.msg || d.message || 'Validation error').join('; ') :
        (data?.detail || data?.message || `Error ${res.status}`);
      
      const safe = String(raw).substring(0, 300);
      throw new APIError(safe, res.status);
    }
    
    return data;
  }

  // Helper for binary file downloads (e.g. PDF Invoices)
  async function _downloadBlob(path, defaultFilename) {
    const token = typeof AUTH !== 'undefined' ? AUTH.getToken() : null;
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${CONFIG.API_BASE}${path}`, { method: 'GET', headers, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new APIError('Failed to download file', res.status);
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
  }
  
  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    put: (path, body) => request('PUT', path, body),
    delete: (path) => request('DELETE', path),
    
    // --- AUTH ---
    login: (email, pass) => request('POST', '/auth/login', { email, password: pass }),
    register: (email, pass, name) => request('POST', '/auth/register', { email, password: pass, full_name: name }),
    logout: async () => {
      if (typeof AUTH === 'undefined') return;
      try { await request('POST', '/auth/logout', {}); } catch (e) { console.warn('Logout API failed locally:', e); }
      AUTH.clearTokens();
    },
    forgotPw: (email) => request('POST', '/auth/forgot-password', { email }),
    resetPw: (newPassword) => request('POST', '/auth/reset-password', { new_password: newPassword }),
    
    // --- PRODUCTS ---
    getProducts: (params = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))).toString();
      return request('GET', `/products${q ? '?' + q : ''}`);
    },
    getProduct: (slug) => request('GET', `/products/${encodeURIComponent(slug)}`),
    createProduct: (data) => request('POST', '/products', data), // Admin
    updateProduct: (id, data) => request('PATCH', `/products/${encodeURIComponent(id)}`, data), // Admin
    deleteProduct: (id) => request('DELETE', `/products/${encodeURIComponent(id)}`), // Admin
    uploadProductImage: (id, file) => { // Admin
      const fd = new FormData(); fd.append('file', file);
      return request('POST', `/products/${encodeURIComponent(id)}/images`, fd);
    },
    deleteProductImage: (id, index) => request('DELETE', `/products/${encodeURIComponent(id)}/images/${encodeURIComponent(index)}`), // Admin
    reorderProductImages: (id, urls) => request('PUT', `/products/${encodeURIComponent(id)}/images/reorder`, urls), // Admin

    // --- CATEGORIES ---
    getCategories: () => request('GET', '/categories'),
    createCategory: (data) => request('POST', '/categories', data), // Admin
    deleteCategory: (id) => request('DELETE', `/categories/${encodeURIComponent(id)}`), // Admin
    
    // --- USERS / PROFILE ---
    getMe: async () => {
      if (typeof AUTH === 'undefined') return null;
      const cached = AUTH.getProfile();
      if (cached) return cached;
      const data = await request('GET', '/users/me');
      if (data) AUTH.setProfile(data);
      return data;
    },
    updateMe: (data) => request('PATCH', '/users/me', data),
    getAddresses: () => request('GET', '/users/me/addresses'),
    addAddress: (data) => request('POST', '/users/me/addresses', data),
    deleteAddress: (id) => request('DELETE', `/users/me/addresses/${encodeURIComponent(id)}`),
    getUsersAdmin: (page = 1, pageSize = 20) => request('GET', `/users/?page=${page}&page_size=${pageSize}`), // Admin
    updateUserAdmin: (id, data) => request('PATCH', `/users/${encodeURIComponent(id)}`, data), // Admin

    // --- CART ---
    getCart: () => request('GET', '/cart'),
    clearCart: () => request('DELETE', '/cart'),
    addCartItem: (productId, quantity) => request('POST', '/cart/items', { product_id: productId, quantity }),
    updateCartItem: (productId, quantity) => request('PUT', `/cart/items/${encodeURIComponent(productId)}`, { quantity }),
    removeCartItem: (productId) => request('DELETE', `/cart/items/${encodeURIComponent(productId)}`),
    getAbandonedCartsAdmin: (hours = 24, page = 1) => request('GET', `/cart/admin/abandoned?hours=${hours}&page=${page}`), // Admin
    sendCartReminderAdmin: (cartId) => request('POST', `/cart/admin/remind/${encodeURIComponent(cartId)}`, {}),
    // Admin

    // --- PRICING ---
    calculatePricing: (items) => request('POST', '/pricing/calculate', { items }),
    getPricingConfig: () => request('GET', '/pricing/config'),

    // --- ORDERS ---
    createOrder: (data) => request('POST', '/orders/', data),
    getMyOrders: (page = 1, pageSize = 10) => request('GET', `/orders/my?page=${page}&page_size=${pageSize}`),
    getMyOrder: (id) => request('GET', `/orders/my/${encodeURIComponent(id)}`),
    cancelOrder: (id) => request('POST', `/orders/my/${encodeURIComponent(id)}/cancel`, {}),
    getAllOrdersAdmin: (page = 1, pageSize = 20, status = null) => { // Admin
       let url = `/orders/?page=${page}&page_size=${pageSize}`;
       if(status) url += `&status_filter=${encodeURIComponent(status)}`;
       return request('GET', url);
    },
    updateOrderAdmin: (id, data) => request('PATCH', `/orders/${encodeURIComponent(id)}`, data), // Admin
    downloadInvoice: (id) => _downloadBlob(`/orders/${encodeURIComponent(id)}/invoice`, `invoice-${id}.pdf`),
    
    // --- PAYMENTS ---
    createPaymentIntent: (orderId) => request('POST', '/payments/create-intent', { order_id: orderId }),
    confirmPayment: (orderId, paymentIntentId) => request('POST', '/payments/confirm', { order_id: orderId, payment_intent_id: paymentIntentId }),
    notifyPaymentFailed: (orderId, paymentIntentId, errorMessage) => request('POST', '/payments/notify-failed', { order_id: orderId, payment_intent_id: paymentIntentId, error_message: errorMessage }),
    
    // --- PUSH NOTIFICATIONS ---
    getVapidKey: () => request('GET', '/push/vapid-key'),
    subscribePush: (data) => request('POST', '/push/subscribe', data),
    unsubscribePush: (data) => request('DELETE', '/push/unsubscribe', data),

    // --- SYSTEM / ADMIN ---
    verifyAdmin: () => request('GET', '/admin/verify'), // Admin
    getHealth: () => request('GET', '/health')
  };
})();
