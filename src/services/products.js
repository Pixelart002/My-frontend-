/**
 * Products & categories service — real backend endpoints only.
 *
 * Backend remains authoritative for:
 * - product availability
 * - price
 * - stock
 * - GST/tax
 * - product metadata
 * - category data
 */
import { request } from '../api/client';

const CATEGORY_CACHE_TTL_MS = 60_000;

let categoriesCache = null;
let categoriesCachedAt = 0;
let categoriesRequest = null;

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params || {}).filter(
      ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== '',
    ),
  );
}

function buildQuery(params) {
  const search =
    new URLSearchParams();
  
  Object.entries(
    cleanParams(params),
  ).forEach(
    ([key, value]) => {
      search.set(
        key,
        String(value),
      );
    },
  );
  
  const query =
    search.toString();
  
  return query ?
    `?${query}` :
    '';
}

function requireSlug(value) {
  const slug =
    String(value ?? '').trim();
  
  if (!slug) {
    throw new TypeError(
      'A valid product slug is required.',
    );
  }
  
  return slug;
}

function normalizeCategories(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }
  
  if (
    response &&
    typeof response === 'object'
  ) {
    if (
      Array.isArray(response.items)
    ) {
      return response.items;
    }
    
    if (
      Array.isArray(response.results)
    ) {
      return response.results;
    }
    
    if (
      response.data &&
      typeof response.data === 'object'
    ) {
      return normalizeCategories(
        response.data,
      );
    }
  }
  
  return [];
}

export const productService = {
  list: (
      params = {},
    ) =>
    request(
      'GET',
      `/products${buildQuery(
        params,
      )}`,
    ),
  
  get: (
      slug,
    ) =>
    request(
      'GET',
      `/products/${encodeURIComponent(
        requireSlug(slug),
      )}`,
    ),
  
  categories: async ({
    force = false,
  } = {}) => {
    const now = Date.now();
    
    if (
      !force &&
      categoriesCache &&
      now - categoriesCachedAt <
      CATEGORY_CACHE_TTL_MS
    ) {
      return categoriesCache;
    }
    
    if (
      !force &&
      categoriesRequest
    ) {
      return categoriesRequest;
    }
    
    const requestPromise =
      request(
        'GET',
        '/categories',
      ).then(
        normalizeCategories,
      );
    
    categoriesRequest =
      requestPromise;
    
    try {
      const items =
        await requestPromise;
      
      categoriesCache =
        items;
      
      categoriesCachedAt =
        Date.now();
      
      return items;
    } finally {
      if (
        categoriesRequest ===
        requestPromise
      ) {
        categoriesRequest = null;
      }
    }
  },
  
  invalidateCategories: () => {
    categoriesCache = null;
    categoriesCachedAt = 0;
  },
};