import { request } from '../api/client';

/**
 * Admin service — real backend endpoints only.
 *
 * Important:
 * - Backend remains the source of truth.
 * - No business logic or permission enforcement is performed here.
 * - IDs are encoded before being placed in URL paths.
 * - FormData is passed directly to the API client.
 */

function clean(params) {
  return Object.fromEntries(
    Object.entries(params || {}).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== '',
    ),
  );
}

function qs(params) {
  const query = new URLSearchParams(
    clean(params),
  ).toString();

  return query;
}

function withQuery(path, params) {
  const query = qs(params);

  return query
    ? `${path}?${query}`
    : path;
}

function encodeId(value) {
  return encodeURIComponent(
    String(value),
  );
}

function normalizePositiveInteger(
  value,
  fallback,
) {
  const number = Number(value);

  return Number.isInteger(number) &&
    number > 0
    ? number
    : fallback;
}

function normalizeNonNegativeInteger(
  value,
  fallback,
) {
  const number = Number(value);

  return Number.isInteger(number) &&
    number >= 0
    ? number
    : fallback;
}

export function itemsOfList(res) {
  if (Array.isArray(res)) {
    return res;
  }

  if (
    !res ||
    typeof res !== 'object'
  ) {
    return [];
  }

  if (Array.isArray(res.items)) {
    return res.items;
  }

  if (Array.isArray(res.results)) {
    return res.results;
  }

  if (
    res.data &&
    typeof res.data === 'object'
  ) {
    return itemsOfList(res.data);
  }

  return [];
}

function normalizePermissionMatrix(
  res,
) {
  if (
    !res ||
    typeof res !== 'object' ||
    !res.effective ||
    typeof res.effective !==
      'object'
  ) {
    return res;
  }

  const effective =
    Object.fromEntries(
      Object.entries(
        res.effective,
      ).map(
        ([role, permissions]) => [
          role,
          Array.isArray(
            permissions,
          )
            ? Object.fromEntries(
                permissions.map(
                  (permission) => [
                    permission,
                    true,
                  ],
                ),
              )
            : permissions,
        ],
      ),
    );

  return {
    ...res,
    effective,
  };
}

async function uploadBusinessAsset(
  assetType,
  file,
) {
  if (!file) {
    throw new Error(
      'A file is required.',
    );
  }

  const form = new FormData();

  form.append(
    'file',
    file,
    file.name ||
      `business-${assetType}`,
  );

  return request(
    'POST',
    `/settings/business-profile/assets/${encodeId(
      assetType,
    )}`,
    form,
  );
}

export const adminService = {
  // ─────────────────────────────
  // Admin / authentication
  // ─────────────────────────────

  verify: () =>
    request(
      'GET',
      '/admin/verify',
    ),

  mfaStatus: () =>
    request(
      'GET',
      '/auth/mfa/status',
    ),

  mfaEnroll: (
    friendlyName = 'Luviio Admin',
  ) =>
    request(
      'POST',
      '/auth/mfa/enroll',
      {
        friendly_name:
          friendlyName,
      },
    ),

  mfaVerify: (code) =>
    request(
      'POST',
      '/auth/mfa/verify',
      { code },
    ),

  mfaUnenroll: (factorId) =>
    request(
      'POST',
      '/auth/mfa/unenroll',
      {
        factor_id: factorId,
      },
    ),

  // ─────────────────────────────
  // Dashboard / reporting
  // ─────────────────────────────

  stats: () =>
    request(
      'GET',
      '/admin/stats',
    ),

  reports: () =>
    request(
      'GET',
      '/admin/reports/summary',
    ),

  paymentsReport: (
    params = {},
  ) =>
    request(
      'GET',
      withQuery(
        '/admin/payments',
        {
          limit: 10,
          offset: 0,
          ...params,
          _ts: Date.now(),
        },
      ),
    ),

  auditLogs: (limit = 200) =>
    request(
      'GET',
      withQuery('/admin/audit', {
        limit:
          normalizePositiveInteger(
            limit,
            200,
          ),
      }),
    ),

  // ─────────────────────────────
  // Products
  // ─────────────────────────────

  listProducts: (
    params = {},
  ) =>
    request(
      'GET',
      withQuery(
        '/products',
        params,
      ),
    ),

  measurementCatalog: () =>
    request(
      'GET',
      '/products/measurements',
    ),

  hsnSuggestions: (
    query,
  ) =>
    request(
      'GET',
      withQuery(
        '/products/hsn-suggestions',
        {
          q: query,
        },
      ),
    ),

  createProduct: (data) =>
    request(
      'POST',
      '/products',
      data,
    ),

  createProductWithImages: (
    data,
    files,
  ) => {
    const form =
      new FormData();

    form.append(
      'product',
      JSON.stringify(data),
    );

    Array.from(files || []).forEach(
      (file) => {
        form.append(
          'files',
          file,
          file.name,
        );
      },
    );

    return request(
      'POST',
      '/products',
      form,
    );
  },

  updateProduct: (
    id,
    data,
  ) =>
    request(
      'PATCH',
      `/products/${encodeId(id)}`,
      data,
    ),

  deleteProduct: (id) =>
    request(
      'DELETE',
      `/products/${encodeId(id)}`,
    ),

  uploadProductImages: async (
    id,
    files,
  ) => {
    const form =
      new FormData();

    Array.from(files || []).forEach(
      (file) => {
        form.append(
          'files',
          file,
          file.name,
        );
      },
    );

    return request(
      'POST',
      `/products/${encodeId(
        id,
      )}/images`,
      form,
    );
  },

  deleteProductImage: (
    id,
    index,
  ) =>
    request(
      'DELETE',
      `/products/${encodeId(
        id,
      )}/images/${encodeId(index)}`,
    ),

  reorderProductImages: (
    id,
    orderedUrls,
  ) =>
    request(
      'PUT',
      `/products/${encodeId(
        id,
      )}/images/reorder`,
      orderedUrls,
    ),

  // ─────────────────────────────
  // Categories
  // ─────────────────────────────

  categories: () =>
    request(
      'GET',
      '/categories',
    ),

  createCategory: (data) =>
    request(
      'POST',
      '/categories',
      data,
    ),

  deleteCategory: (id) =>
    request(
      'DELETE',
      `/categories/${encodeId(id)}`,
    ),

  // ─────────────────────────────
  // Orders / users
  // ─────────────────────────────

  listOrders: (
    params = {},
  ) =>
    request(
      'GET',
      withQuery(
        '/orders/',
        params,
      ),
    ),

  updateOrder: (
    id,
    data,
  ) =>
    request(
      'PATCH',
      `/orders/${encodeId(id)}`,
      data,
    ),

  listUsers: (
    params = {},
  ) =>
    request(
      'GET',
      withQuery(
        '/users/',
        params,
      ),
    ),

  updateUser: (
    id,
    data,
  ) =>
    request(
      'PATCH',
      `/users/${encodeId(id)}`,
      data,
    ),

  // ─────────────────────────────
  // Coupons
  // ─────────────────────────────

  listCoupons: (
    params = {},
  ) =>
    request(
      'GET',
      withQuery(
        '/coupons/manage',
        params,
      ),
    ),

  createCoupon: (data) =>
    request(
      'POST',
      '/coupons/manage',
      data,
    ),

  updateCoupon: (
    id,
    data,
  ) =>
    request(
      'PATCH',
      `/coupons/manage/${encodeId(
        id,
      )}`,
      data,
    ),

  deleteCoupon: (id) =>
    request(
      'DELETE',
      `/coupons/manage/${encodeId(
        id,
      )}`,
    ),

  // ─────────────────────────────
  // Inventory
  // ─────────────────────────────

  lowStock: () =>
    request(
      'GET',
      '/inventory/low-stock',
    ),

  adjustStock: (
    productId,
    delta,
    reason,
  ) =>
    request(
      'POST',
      '/inventory/admin/adjust',
      {
        product_id: productId,
        delta,
        reason,
      },
    ),

  scanLowStock: () =>
    request(
      'POST',
      '/inventory/low-stock/scan',
    ),

  releaseStaleOrders: (
    minutesOld = 30,
  ) =>
    request(
      'POST',
      withQuery(
        '/inventory/stale-orders/release',
        {
          minutes_old:
            normalizePositiveInteger(
              minutesOld,
              30,
            ),
        },
      ),
    ),

  // ─────────────────────────────
  // Shipping
  // ─────────────────────────────

  shippingMethods: (
    activeOnly = true,
  ) =>
    request(
      'GET',
      withQuery(
        '/shipping/methods',
        {
          active_only:
            activeOnly,
        },
      ),
    ),

  fulfillmentShipments: (
    statusFilter = null,
  ) =>
    request(
      'GET',
      withQuery(
        '/shipping/provider/shipments',
        {
          status_filter:
            statusFilter,
        },
      ),
    ),

  createProviderShipment: (
    orderId,
    data = {},
  ) =>
    request(
      'POST',
      withQuery(
        `/shipping/provider/orders/${encodeId(
          orderId,
        )}`,
        data,
      ),
    ),

  assignAwb: (
    shipmentId,
    courierId = null,
  ) =>
    request(
      'POST',
      withQuery(
        `/shipping/provider/shipments/${encodeId(
          shipmentId,
        )}/awb`,
        {
          courier_id:
            courierId,
        },
      ),
    ),

  schedulePickup: (
    shipmentId,
  ) =>
    request(
      'POST',
      `/shipping/provider/shipments/${encodeId(
        shipmentId,
      )}/pickup`,
    ),

  generateLabel: (
    shipmentId,
  ) =>
    request(
      'POST',
      `/shipping/provider/shipments/${encodeId(
        shipmentId,
      )}/label`,
    ),

  generateManifest: (
    shipmentId,
  ) =>
    request(
      'POST',
      `/shipping/provider/shipments/${encodeId(
        shipmentId,
      )}/manifest`,
    ),

  generateProviderInvoice: (
    shipmentId,
  ) =>
    request(
      'POST',
      `/shipping/provider/shipments/${encodeId(
        shipmentId,
      )}/invoice`,
    ),

  processProviderShipment: (
    shipmentId,
  ) =>
    request(
      'POST',
      `/shipping/provider/shipments/${encodeId(
        shipmentId,
      )}/process`,
    ),

  syncTracking: (
    shipmentId,
  ) =>
    request(
      'POST',
      `/shipping/provider/shipments/${encodeId(
        shipmentId,
      )}/sync`,
    ),

  cancelProviderShipment: (
    shipmentId,
  ) =>
    request(
      'POST',
      `/shipping/provider/shipments/${encodeId(
        shipmentId,
      )}/cancel`,
    ),

  createShipping: (data) =>
    request(
      'POST',
      '/shipping/manage',
      data,
    ),

  updateShipping: (
    id,
    data,
  ) =>
    request(
      'PATCH',
      `/shipping/manage/${encodeId(
        id,
      )}`,
      data,
    ),

  deleteShipping: (id) =>
    request(
      'DELETE',
      `/shipping/manage/${encodeId(
        id,
      )}`,
    ),

  // ─────────────────────────────
  // Subscriptions
  // ─────────────────────────────

  subscriptionPlans: (
    activeOnly = true,
  ) =>
    request(
      'GET',
      withQuery(
        '/subscriptions/plans',
        {
          active_only:
            activeOnly,
        },
      ),
    ),

  createSubscription: (data) =>
    request(
      'POST',
      '/subscriptions/plans',
      data,
    ),

  updateSubscription: (
    id,
    data,
  ) =>
    request(
      'PUT',
      `/subscriptions/plans/${encodeId(
        id,
      )}`,
      data,
    ),

  // ─────────────────────────────
  // RBAC / ABAC
  // ─────────────────────────────

  permissionCatalogue: () =>
    request(
      'GET',
      '/rbac/permissions/catalogue',
    ),

  permissions: async () =>
    normalizePermissionMatrix(
      await request(
        'GET',
        '/rbac/permissions',
      ),
    ),

  togglePermission: (
    role,
    permission,
    enabled,
  ) =>
    request(
      'POST',
      '/rbac/permissions/toggle',
      {
        role,
        permission,
        enabled,
      },
    ),

  userActions: (userId) =>
    request(
      'GET',
      `/rbac/users/${encodeId(
        userId,
      )}/actions`,
    ),

  setUserAction: (
    userId,
    action,
    enabled,
    reason,
  ) =>
    request(
      'POST',
      `/rbac/users/${encodeId(
        userId,
      )}/actions`,
      {
        action,
        enabled,
        reason,
      },
    ),

  removeUserAction: (
    userId,
    action,
  ) =>
    request(
      'DELETE',
      `/rbac/users/${encodeId(
        userId,
      )}/actions/${encodeId(
        action,
      )}`,
    ),

  // ─────────────────────────────
  // Push notifications
  // ─────────────────────────────

  pushStats: () =>
    request(
      'GET',
      '/push/admin/stats',
    ),

  sendPush: (data) =>
    request(
      'POST',
      '/push/admin/send',
      data,
    ),

  // ─────────────────────────────
  // Reviews moderation
  // ─────────────────────────────

  reviewList: (status) =>
    request(
      'GET',
      withQuery(
        '/reviews/admin',
        {
          status_filter: status,
        },
      ),
    ),

  moderateReview: (
    id,
    status,
  ) =>
    request(
      'PATCH',
      `/reviews/admin/${encodeId(
        id,
      )}`,
      {
        status,
      },
    ),

  // ─────────────────────────────
  // System settings
  // ─────────────────────────────

  settings: (category) =>
    request(
      'GET',
      withQuery('/settings/', {
        category,
      }),
    ),

  updateSetting: (
    key,
    value,
    reason,
  ) =>
    request(
      'PATCH',
      `/settings/${encodeId(key)}`,
      {
        value,
        reason,
      },
    ),

  resetSetting: (key) =>
    request(
      'POST',
      `/settings/${encodeId(
        key,
      )}/reset`,
    ),

  // ─────────────────────────────
  // Business profile assets
  // ─────────────────────────────

  uploadBusinessLogo: (file) =>
    uploadBusinessAsset(
      'logo',
      file,
    ),

  uploadBusinessSignature: (
    file,
  ) =>
    uploadBusinessAsset(
      'signature',
      file,
    ),
};