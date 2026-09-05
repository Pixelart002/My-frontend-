/* ============================================================
   LUVIIO — API  (v8.4 — Enterprise Sync, 401 Refresh & B2B Billing)
   ============================================================ */

class APIError extends Error {
  constructor(message, status, code = null) {
    super(message);
    this.name   = 'APIError';
    this.status = status;
    this.code   = code;
  }
}

const API = (() => {

  const PUBLIC_PREFIXES = [
    '/products', '/categories', '/pricing/config',
    '/health', '/push/vapid-key',
  ];

  const IDEMPOTENT = new Set(['GET', 'PUT', 'HEAD']);
  const MAX_RETRIES = 3;

  function _isPublic(path) {
    return PUBLIC_PREFIXES.some(p => path.startsWith(p));
  }

  function _backoff(attempt) {
    return 1000 * Math.pow(2, attempt - 1);
  }

  async function _fetchOnce(method, path, body, headers) {
    const opts = {
      method,
      headers,
      credentials: 'include',
      signal: AbortSignal.timeout(12000),
    };

    if (body !== null && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      opts.body = body;
    }

    return fetch(`${window.CONFIG.API_BASE}${path}`, opts);
  }

  async function request(method, path, body = null, isRetry = false) {
    const headers = {};
    const token = window.AUTH ? AUTH.getToken() : null;

    if (token && !_isPublic(path)) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const canRetry = IDEMPOTENT.has(method.toUpperCase());
    let attempt = 0;

    while (attempt <= (canRetry ? MAX_RETRIES - 1 : 0)) {
      attempt++;

      try {
        const res = await _fetchOnce(method, path, body, { ...headers });

        if (res.status === 401 && !isRetry && !path.startsWith('/auth/')) {
          if (window.AUTH) {
            const refreshed = await AUTH.init(true);
            if (refreshed) return request(method, path, body, true);
            AUTH.clearTokens();
          }
          return null;
        }

        if (res.status === 204) return null;

        let data;
        try { data = await res.json(); } catch { data = {}; }

        if (!res.ok) {
          const rawMessage = Array.isArray(data?.detail)
            ? data.detail.map(d => d.msg || d.message || 'Validation error').join('; ')
            : (data?.message || data?.detail || `Error ${res.status}`);
          const safe = String(rawMessage).substring(0, 300);
          throw new APIError(safe, res.status, data?.error_code);
        }

        return (data && data.success !== undefined && data.data !== undefined)
          ? data.data
          : data;

      } catch (err) {
        if (err instanceof APIError) throw err;

        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
          throw new APIError('Request timed out — please try again', 0, 'TIMEOUT');
        }

        if (!canRetry || attempt > MAX_RETRIES - 1) break;
        await new Promise(r => setTimeout(r, _backoff(attempt)));
      }
    }

    throw new APIError('Network error — please check your connection', 0, 'NETWORK_ERROR');
  }

  async function _downloadBlob(path, defaultFilename) {
    const token = window.AUTH ? AUTH.getToken() : null;
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${window.CONFIG.API_BASE}${path}`, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: AbortSignal.timeout(20000),
    });
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

    login: (email, pass) => request('POST', '/auth/login', { email, password: pass }),
    register: (email, pass, name) => request('POST', '/auth/register', { email, password: pass, full_name: name }),
    logout: async () => {
      if (typeof AUTH === 'undefined') return;
      try { await request('POST', '/auth/logout', {}); } catch (e) { console.warn('Logout API failed:', e); }
      AUTH.clearTokens();
    },
    forgotPw: (email) => request('POST', '/auth/forgot-password', { email }),
    resetPw: (newPassword) => request('POST', '/auth/reset-password', { new_password: newPassword }),

    getProducts: (params = {}) => {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))).toString();
      return request('GET', `/products${q ? '?' + q : ''}`);
    },
    getProduct: (slug) => request('GET', `/products/${encodeURIComponent(slug)}`),
    createProduct: (data) => request('POST', '/products', data),
    updateProduct: (id, data) => request('PATCH', `/products/${encodeURIComponent(id)}`, data),
    deleteProduct: (id) => request('DELETE', `/products/${encodeURIComponent(id)}`),
    uploadProductImage: (id, file) => { const fd = new FormData(); fd.append('file', file); return request('POST', `/products/${encodeURIComponent(id)}/images`, fd); },
    deleteProductImage: (id, index) => request('DELETE', `/products/${encodeURIComponent(id)}/images/${encodeURIComponent(index)}`),
    reorderProductImages: (id, urls) => request('PUT', `/products/${encodeURIComponent(id)}/images/reorder`, urls),

    getCategories: () => request('GET', '/categories'),
    createCategory: (data) => request('POST', '/categories', data),
    deleteCategory: (id) => request('DELETE', `/categories/${encodeURIComponent(id)}`),

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
    getUsersAdmin: (page = 1, size = 20) => request('GET', `/users/?page=${page}&page_size=${size}`),
    updateUserAdmin: (id, data) => request('PATCH', `/users/${encodeURIComponent(id)}`, data),

    getCart: () => request('GET', '/cart'),
    clearCart: () => request('DELETE', '/cart'),
    addCartItem: (pid, qty) => request('POST', '/cart/items', { product_id: pid, quantity: qty }),
    updateCartItem: (pid, qty) => request('PUT', `/cart/items/${encodeURIComponent(pid)}`, { quantity: qty }),
    removeCartItem: (pid) => request('DELETE', `/cart/items/${encodeURIComponent(pid)}`),
    getAbandonedCartsAdmin: (h = 24, page = 1) => request('GET', `/cart/admin/abandoned?hours=${h}&page=${page}`),
    sendCartReminderAdmin: (cartId) => request('POST', `/cart/admin/remind/${encodeURIComponent(cartId)}`, {}),

    calculatePricing: (items) => request('POST', '/pricing/calculate', { items }),
    getPricingConfig: () => request('GET', '/pricing/config'),

    createOrder: (data) => request('POST', '/orders/', data),
    getMyOrders: (page = 1, size = 10) => request('GET', `/orders/my?page=${page}&page_size=${size}`),
    getMyOrder: (id) => request('GET', `/orders/my/${encodeURIComponent(id)}`),
    cancelOrder: (id) => request('POST', `/orders/my/${encodeURIComponent(id)}/cancel`, {}),
    getAllOrdersAdmin: (page = 1, size = 20, s = null) => {
      let url = `/orders/?page=${page}&page_size=${size}`;
      if (s) url += `&status_filter=${encodeURIComponent(s)}`;
      return request('GET', url);
    },
    updateOrderAdmin: (id, data) => request('PATCH', `/orders/${encodeURIComponent(id)}`, data),
    downloadInvoice: (id) => _downloadBlob(`/orders/${encodeURIComponent(id)}/invoice`, `invoice-${id}.pdf`),

    createPaymentIntent: (addressId, idemKey, billingId = null) => {
      const payload = { shipping_address_id: addressId, idempotency_key: idemKey };
      if (billingId) payload.billing_address_id = billingId;
      return request('POST', '/payments/create-intent', payload);
    },
    confirmPayment: (piId) => request('POST', '/payments/confirm', { payment_intent_id: piId }),
    notifyPaymentFailed: (piId, errMsg) => request('POST', '/payments/notify-failed', { payment_intent_id: piId, error_message: errMsg }),
    retryPayment: (orderId) => request('POST', `/payments/retry/${encodeURIComponent(orderId)}`, {}),

    getVapidKey: () => request('GET', '/push/vapid-key'),
    subscribePush: (data) => request('POST', '/push/subscribe', data),
    unsubscribePush: (data) => request('DELETE', '/push/unsubscribe', data),

    verifyAdmin: () => request('GET', '/admin/verify'),
    getHealth: () => request('GET', '/health'),
  };
})();

window.API = API;

// Transitional compatibility: legacy pages such as admin.html contain a few
// direct fetch() calls outside API.req(). Ensure those API calls also carry
// auth cookies. This can be removed after the legacy pages are migrated.
(() => {
  const nativeFetch = window.fetch.bind(window);
  const apiBase = String(window.CONFIG?.API_BASE || '').replace(/\/$/, '');
  if (!apiBase || window.__luviioFetchCredentialsPatched) return;
  window.__luviioFetchCredentialsPatched = true;

  window.fetch = (input, init = {}) => {
    try {
      const requestUrl = typeof input === 'string' ? input : input?.url;
      const absoluteUrl = new URL(requestUrl, window.location.href).href.replace(/\/$/, '');
      const isApiRequest = absoluteUrl === apiBase || absoluteUrl.startsWith(`${apiBase}/`);
      if (isApiRequest && init.credentials === undefined) {
        init = { ...init, credentials: 'include' };
      }
    } catch (_) {
      // Preserve native fetch behavior for malformed/non-URL inputs.
    }
    return nativeFetch(input, init);
  };
})();
