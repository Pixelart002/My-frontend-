/**
 * Products & categories service — real backend endpoints.
 */
import { downloadFile, request } from '../api/client';

const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''));

export const productService = {
  list: (params = {}) => request('GET', `/products?${new URLSearchParams(cleanParams(params)).toString()}`),

  get: (slug) => request('GET', `/products/${encodeURIComponent(slug)}`),

  categories: () => request('GET', '/categories'),
};
