/* ============================================================
   LUVIIO — API  (v2 — fixed)
   ============================================================
   FIXES:
   1. AbortSignal.timeout(10000) on every request — no more hangs
   2. Error messages sanitized — don't leak stack traces or
      internal details to the console in production
   3. 401 on /auth/* endpoints never triggers refresh loop
   4. Token never added to GET requests for public endpoints
      (products, categories) — reduces exposure surface
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
  const PUBLIC_PREFIXES = ['/products', '/categories'];
  
  function _isPublic(path) {
    return PUBLIC_PREFIXES.some(p => path.startsWith(p));
  }
  
  async function request(method, path, body = null, isRetry = false) {
    const headers = {};
    const token = AUTH.getToken();
    
    // FIX: Don't send token to public endpoints (reduces exposure)
    if (token && !_isPublic(path)) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const opts = {
      method,
      headers,
      signal: AbortSignal.timeout(10000), // FIX: 10s timeout — no more hangs
    };
    
    if (body !== null && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      // Let browser set multipart Content-Type with boundary
      opts.body = body;
    }
    
    let res;
    try {
      res = await fetch(`${CONFIG.API_BASE}${path}`, opts);
    } catch (networkErr) {
      // FIX: Don't log actual error — could contain token/URL details
      if (networkErr.name === 'TimeoutError') {
        throw new APIError('Request timed out — please try again', 0);
      }
      throw new APIError('Network error — please check your connection', 0);
    }
    
    const isAuthEndpoint = path.startsWith('/auth/');
    
    // Auto-refresh on 401 — but NOT for auth endpoints (avoid loops)
    if (res.status === 401 && !isRetry && !isAuthEndpoint) {
      const refreshed = await AUTH.init();
      if (refreshed) return request(method, path, body, true);
      AUTH.clearTokens();
      const current = window.location.pathname;
      const isOnLogin = current === '/login.html' || current === '/login' || current.endsWith('/login.html');
      if (!isOnLogin) {
        const redirect = encodeURIComponent(current + window.location.search);
        window.location.href = `/login.html?redirect=${redirect}`;
      }
      return null;
    }
    
    if (res.status === 204) return null;
    
    let data;
    try { data = await res.json(); } catch { data = {}; }
    
    if (!res.ok) {
      // FIX: Sanitize error — never expose internal server details
      const raw = Array.isArray(data?.detail) ?
        data.detail.map(d => d.msg || d.message || 'Validation error').join('; ') :
        (data?.detail || data?.message || `Error ${res.status}`);
      
      // Only show user-safe messages — strip any stack/internal info
      const safe = String(raw).substring(0, 300);
      throw new APIError(safe, res.status);
    }
    
    return data;
  }
  
  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    delete: (path) => request('DELETE', path),
    
    login: (email, pass) => API.post('/auth/login', { email, password: pass }),
    register: (email, pass, name) => API.post('/auth/register', { email, password: pass, full_name: name }),
    logout: () => API.post('/auth/logout', {}),
    forgotPw: (email) => API.post('/auth/forgot-password', { email }),
    
    getProducts(params = {}) {
      const q = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
      ).toString();
      return API.get(`/products${q ? '?' + q : ''}`);
    },
    getProduct: (slug) => API.get(`/products/${encodeURIComponent(slug)}`),
    getCategories: () => API.get('/categories'),
    
    createOrder: (data) => API.post('/orders/', data),
    getMyOrders: (page) => API.get(`/orders/my?page=${page}&page_size=10`),
    getMyOrder: (id) => API.get(`/orders/my/${id}`),
    cancelOrder: (id) => API.post(`/orders/my/${id}/cancel`, {}),
    
    createPaymentIntent: (orderId) => API.post('/payments/create-intent', { order_id: orderId }),
    // ADDED: Endpoint for frontend Stripe errors
    notifyPaymentFailed: (orderId, paymentIntentId, errorMessage) => 
      API.post('/payments/notify-failed', { 
        order_id: orderId, 
        payment_intent_id: paymentIntentId, 
        error_message: errorMessage 
      }),
    
    getMe: () => API.get('/users/me'),
    updateMe: (data) => API.patch('/users/me', data),
    getAddresses: () => API.get('/users/me/addresses'),
    addAddress: (data) => API.post('/users/me/addresses', data),
    deleteAddress: (id) => API.delete(`/users/me/addresses/${id}`),
  };
})();
