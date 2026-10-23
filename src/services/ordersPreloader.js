import { adminService, itemsOfList } from './admin';

const PAGE_SIZE = 100; // API enforces a maximum page_size of 100.
const PAGE_BATCH_SIZE = 3;
const CACHE_TTL_MS = 15_000;

const snapshots = new Map();
const inFlight = new Map();

function cacheKey(scope) {
  return String(scope || 'authenticated-admin-session');
}

function readMeta(result) {
  return result?.meta ?? result?.data?.meta ?? {};
}

function finiteNonNegative(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function rowKey(order, index) {
  return String(
    order?.id ??
      order?.order_number ??
      `${order?.created_at ?? 'order'}-${index}`,
  );
}

function uniqueOrders(rows) {
  const seen = new Set();
  return rows.filter((order, index) => {
    const key = rowKey(order, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Preload the complete, permission-filtered Orders ledger before exposing it
 * to the page. Pagination is fetched in small batches to avoid a burst of
 * requests while keeping a 200-300 row ledger to a few round trips.
 *
 * Cache is memory-only, short-lived, and keyed to the authenticated user so a
 * second admin session cannot accidentally reuse another session's order rows.
 */
export function getOrdersSnapshot(scope) {
  return snapshots.get(cacheKey(scope)) ?? null;
}

export async function preloadOrders(scope, { force = false } = {}) {
  const key = cacheKey(scope);
  const cached = snapshots.get(key);

  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const firstResult = await adminService.listOrders({
      page: 1,
      page_size: PAGE_SIZE,
      _ts: Date.now(),
    });

    const firstItems = itemsOfList(firstResult);
    const firstMeta = readMeta(firstResult);
    const reportedTotal = finiteNonNegative(firstMeta.total_items);
    const reportedPages = finiteNonNegative(firstMeta.total_pages);

    let totalPages = reportedPages;
    if (totalPages === null) {
      totalPages = reportedTotal === null
        ? (firstItems.length >= PAGE_SIZE ? 2 : 1)
        : Math.ceil(reportedTotal / PAGE_SIZE);
    } else if (reportedTotal !== null && reportedTotal > 0) {
      totalPages = Math.max(totalPages, Math.ceil(reportedTotal / PAGE_SIZE));
    }

    // If the API omitted pagination metadata and the first page is full,
    // discover remaining pages incrementally rather than treating 100 rows
    // as the complete ledger.
    const hasReliablePageCount = reportedPages !== null || reportedTotal !== null;
    const rows = [...firstItems];

    if (hasReliablePageCount) {
      for (let firstPage = 2; firstPage <= totalPages; firstPage += PAGE_BATCH_SIZE) {
        const pageNumbers = Array.from(
          { length: Math.min(PAGE_BATCH_SIZE, totalPages - firstPage + 1) },
          (_, index) => firstPage + index,
        );

        const pageResults = await Promise.all(
          pageNumbers.map((page) =>
            adminService.listOrders({
              page,
              page_size: PAGE_SIZE,
              _ts: Date.now(),
            }),
          ),
        );

        pageResults.forEach((result) => {
          rows.push(...itemsOfList(result));
        });
      }
    } else {
      let page = 2;
      let lastPageSize = firstItems.length;

      while (lastPageSize >= PAGE_SIZE && page <= 100) {
        const result = await adminService.listOrders({
          page,
          page_size: PAGE_SIZE,
          _ts: Date.now(),
        });
        const pageItems = itemsOfList(result);
        rows.push(...pageItems);
        lastPageSize = pageItems.length;
        page += 1;
      }
    }

    const items = uniqueOrders(rows);
    const totalOrders = reportedTotal ?? items.length;
    const snapshot = {
      items,
      totalOrders,
      fetchedAt: Date.now(),
    };

    snapshots.set(key, snapshot);
    return snapshot;
  })();

  inFlight.set(key, request);

  try {
    return await request;
  } finally {
    if (inFlight.get(key) === request) {
      inFlight.delete(key);
    }
  }
}

export function clearOrdersSnapshot(scope) {
  if (scope === undefined) {
    snapshots.clear();
    return;
  }

  snapshots.delete(cacheKey(scope));
}
