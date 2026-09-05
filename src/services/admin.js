/**
 * Admin service — real backend endpoints only.
 *
 * Gates and dashboard: /admin/verify, /admin/stats
 * Catalogue CRUD:      /products, /products/{id}, /categories
 * Order management:    /orders, /orders/{id}
 * User management:     /users, /users/{id}
 *
 * The API client unwraps the `{ success, data, meta }` envelope and returns
 * `data` directly, which for list endpoints is the items array. We therefore
 * normalize robustly below (arrays OR `{ items }` shapes).
 */
import { request } from '../api/client';

const clean = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''));

const qs = (params) => new URLSearchParams(clean(params)).toString();

/** Normalize a list response into an array of items. */
export function itemsOfList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.items)) return res.items;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export const adminService = {
  // ── Gate + dashboard ───────────────────────────────────────────
  verify: () => request('GET', '/admin/verify'),
  stats: () => request('GET', '/admin/stats'),

  // ── Catalogue ──────────────────────────────────────────────────
  listProducts: (params) => request('GET', `/products?${qs(params)}`),
  createProduct: (data) => request('POST', '/products', data),
  updateProduct: (id, data) => request('PATCH', `/products/${encodeURIComponent(id)}`, data),
  deleteProduct: (id) => request('DELETE', `/products/${encodeURIComponent(id)}`),

  categories: () => request('GET', '/categories'),
  createCategory: (data) => request('POST', '/categories', data),
  deleteCategory: (id) => request('DELETE', `/categories/${encodeURIComponent(id)}`),

  // ── Orders ──────────────────────────────────────────────────────
  listOrders: (params) => request('GET', `/orders/?${qs(params)}`),
  updateOrder: (id, data) => request('PATCH', `/orders/${encodeURIComponent(id)}`, data),

  // ── Users ───────────────────────────────────────────────────────
  listUsers: (params) => request('GET', `/users/?${qs(params)}`),
  updateUser: (id, data) => request('PATCH', `/users/${encodeURIComponent(id)}`, data),
};
