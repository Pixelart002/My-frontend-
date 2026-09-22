/**
 * Products & categories service — real backend endpoints.
 */
import { downloadFile, request } from '../api/client';

const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''));

const CATEGORY_CACHE_TTL_MS = 60_000;
let categoriesCache = null;
let categoriesCachedAt = 0;
let categoriesRequest = null;

export const productService = {
  list: (params = {}) => request('GET', `/products?${new URLSearchParams(cleanParams(params)).toString()}`),

  get: (slug) => request('GET', `/products/${encodeURIComponent(slug)}`),

  categories: async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && categoriesCache && now - categoriesCachedAt < CATEGORY_CACHE_TTL_MS) {
      return categoriesCache;
    }

    if (!force && categoriesRequest) {
      return categoriesRequest;
    }

    categoriesRequest = request('GET', '/categories')
      .then((items) => {
        categoriesCache = Array.isArray(items) ? items : [];
        categoriesCachedAt = Date.now();
        return categoriesCache;
      })
      .finally(() => {
        categoriesRequest = null;
      });

    return categoriesRequest;
  },

  invalidateCategories: () => {
    categoriesCache = null;
    categoriesCachedAt = 0;
  },
};
