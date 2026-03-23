class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

const API = (() => {
  async function request(method, path, body = null, isRetry = false) {
    const headers = {};
    const token = AUTH.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body !== null && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      opts.body = body;
    }
    
    let res;
    try {
      res = await fetch(`${CONFIG.API_BASE}${path}`, opts);
    } catch (networkErr) {
      throw new APIError('Network error — please check your connection', 0);
    }
    
    // Auto-refresh on 401 — ONLY for non-auth endpoints
    // ✅ FIX: /auth/login aur /auth/register pe 401 aane par
    //         refresh loop mein mat jaao — directly error throw karo
    const isAuthEndpoint = path.startsWith('/auth/');
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
      const msg = Array.isArray(data?.detail) ?
        data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; ') :
        (data?.detail || data?.message || `Request failed (${res.status})`);
      throw new APIError(msg, res.status);
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
    
    getMe: () => API.get('/users/me'),
    updateMe: (data) => API.patch('/users/me', data),
    getAddresses: () => API.get('/users/me/addresses'),
    addAddress: (data) => API.post('/users/me/addresses', data),
    deleteAddress: (id) => API.delete(`/users/me/addresses/${id}`),
  };
})();