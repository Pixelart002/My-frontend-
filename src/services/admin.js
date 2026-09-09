/**
 * Admin service — real backend endpoints only.
 *
 * Gates and dashboard: /admin/verify, /admin/stats
 * Catalogue CRUD:      /products, /products/{id}, /categories
 * Order management:    /orders, /orders/{id}
 * User management:     /users, /users/{id}
 *
 * The API client unwraps the `{ success, data, meta }` envelope. List
 * endpoints normally return the items array directly; the normalizer below
 * also accepts common paginated/nested shapes so the admin UI remains
 * compatible with backend response envelopes.
 */
import { request } from '../api/client';

const clean = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''));

const qs = (params) => new URLSearchParams(clean(params)).toString();

/** Normalize a list response into an array of items. */
export function itemsOfList(res) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.results)) return res.results;
  if (res.data && typeof res.data === 'object') return itemsOfList(res.data);
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
