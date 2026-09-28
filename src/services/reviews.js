import { request } from '../api/client';

export const reviewService = {
  listForProduct: (productId) => request('GET', `/reviews/products/${encodeURIComponent(productId)}`),
  create: (productId, data) => request('POST', `/reviews/products/${encodeURIComponent(productId)}`, data),
  mine: () => request('GET', '/reviews/me'),
  adminList: (status) => request('GET', `/reviews/admin${status ? `?status_filter=${encodeURIComponent(status)}` : ''}`),
  moderate: (id, status) => request('PATCH', `/reviews/admin/${encodeURIComponent(id)}`, { status }),
};
