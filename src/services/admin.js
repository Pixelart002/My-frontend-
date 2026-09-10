/**
 * Admin service — real backend endpoints only.
 */
import { request } from '../api/client';

const clean = (params) => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''));
const qs = (params) => new URLSearchParams(clean(params)).toString();

export function itemsOfList(res) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.results)) return res.results;
  if (res.data && typeof res.data === 'object') return itemsOfList(res.data);
  return [];
}

const normalizePermissionMatrix = (res) => {
  if (!res || typeof res !== 'object' || !res.effective || typeof res.effective !== 'object') return res;
  const effective = Object.fromEntries(Object.entries(res.effective).map(([role, permissions]) => [role, Array.isArray(permissions) ? Object.fromEntries(permissions.map((permission) => [permission, true])) : permissions]));
  return { ...res, effective };
};

export const adminService = {
  verify: () => request('GET', '/admin/verify'),
  stats: () => request('GET', '/admin/stats'),
  reports: () => request('GET', '/admin/reports/summary'),
  paymentsReport: (params = {}) => request('GET', `/admin/payments?${qs({ limit: 10, offset: 0, ...params })}`),
  auditLogs: (limit = 200) => request('GET', `/admin/audit?limit=${limit}`),

  listProducts: (params) => request('GET', `/products?${qs(params)}`),
  createProduct: (data) => request('POST', '/products', data),
  createProductWithImages: (data, files) => { const form = new FormData(); form.append('product', JSON.stringify(data)); Array.from(files || []).forEach((file) => form.append('files', file, file.name)); return request('POST', '/products', form); },
  updateProduct: (id, data) => request('PATCH', `/products/${encodeURIComponent(id)}`, data),
  deleteProduct: (id) => request('DELETE', `/products/${encodeURIComponent(id)}`),
  uploadProductImages: async (id, files) => { const form = new FormData(); Array.from(files || []).forEach((file) => form.append('files', file, file.name)); return request('POST', `/products/${encodeURIComponent(id)}/images`, form); },
  deleteProductImage: (id, index) => request('DELETE', `/products/${encodeURIComponent(id)}/images/${index}`),
  reorderProductImages: (id, orderedUrls) => request('PUT', `/products/${encodeURIComponent(id)}/images/reorder`, orderedUrls),
  categories: () => request('GET', '/categories'),
  createCategory: (data) => request('POST', '/categories', data),
  deleteCategory: (id) => request('DELETE', `/categories/${encodeURIComponent(id)}`),

  listOrders: (params) => request('GET', `/orders/?${qs(params)}`),
  updateOrder: (id, data) => request('PATCH', `/orders/${encodeURIComponent(id)}`, data),
  listUsers: (params) => request('GET', `/users/?${qs(params)}`),
  updateUser: (id, data) => request('PATCH', `/users/${encodeURIComponent(id)}`, data),

  listCoupons: (params) => request('GET', `/coupons/manage?${qs(params)}`),
  createCoupon: (data) => request('POST', '/coupons/manage', data),
  updateCoupon: (id, data) => request('PATCH', `/coupons/manage/${encodeURIComponent(id)}`, data),
  deleteCoupon: (id) => request('DELETE', `/coupons/manage/${encodeURIComponent(id)}`),

  lowStock: () => request('GET', '/inventory/low-stock'),
  scanLowStock: () => request('POST', '/inventory/low-stock/scan'),
  releaseStaleOrders: (minutesOld = 30) => request('POST', `/inventory/stale-orders/release?minutes_old=${minutesOld}`),

  shippingMethods: (activeOnly = true) => request('GET', `/shipping/methods?active_only=${activeOnly}`),
  createShipping: (data) => request('POST', '/shipping/manage', data),
  updateShipping: (id, data) => request('PATCH', `/shipping/manage/${encodeURIComponent(id)}`, data),
  deleteShipping: (id) => request('DELETE', `/shipping/manage/${encodeURIComponent(id)}`),

  subscriptionPlans: (activeOnly = true) => request('GET', `/subscriptions/plans?active_only=${activeOnly}`),
  createSubscription: (data) => request('POST', '/subscriptions/plans', data),
  updateSubscription: (id, data) => request('PUT', `/subscriptions/plans/${encodeURIComponent(id)}`, data),

  permissionCatalogue: () => request('GET', '/rbac/permissions/catalogue'),
  permissions: async () => normalizePermissionMatrix(await request('GET', '/rbac/permissions')),
  togglePermission: (role, permission, enabled) => request('POST', '/rbac/permissions/toggle', { role, permission, enabled }),
  userActions: (userId) => request('GET', `/rbac/users/${encodeURIComponent(userId)}/actions`),
  setUserAction: (userId, action, enabled, reason) => request('POST', '/rbac/users/actions', { userId, action, enabled, reason }),
  removeUserAction: (userId, action) => request('DELETE', `/rbac/users/${encodeURIComponent(userId)}/actions/${encodeURIComponent(action)}`),

  pushStats: () => request('GET', '/push/admin/stats'),
  sendPush: (data) => request('POST', '/push/admin/send', data),

  reviewList: (status) => request('GET', `/reviews/admin${status ? `?status_filter=${encodeURIComponent(status)}` : ''}`),
  moderateReview: (id, status) => request('PATCH', `/reviews/admin/${encodeURIComponent(id)}`, { status }),

  settings: (category) => request('GET', `/settings/?${qs({ category })}`),
  updateSetting: (key, value, reason) => request('PATCH', `/settings/${encodeURIComponent(key)}`, { value, reason }),
  resetSetting: (key) => request('POST', `/settings/${encodeURIComponent(key)}/reset`),
};
