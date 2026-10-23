import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listOrders: vi.fn(),
}));

vi.mock('./admin', () => ({
  adminService: {
    listOrders: mocks.listOrders,
  },
  itemsOfList: (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.items)) return result.items;
    return [];
  },
}));

import {
  clearOrdersSnapshot,
  getOrdersSnapshot,
  preloadOrders,
} from './ordersPreloader';

const makePage = (page, count, total = 230, pages = Math.ceil(total / 100)) => ({
  data: Array.from({ length: count }, (_, index) => {
    const id = (page - 1) * 100 + index + 1;
    return {
      id: `order-${id}`,
      order_number: `ORD-${id}`,
    };
  }),
  meta: {
    page,
    page_size: 100,
    total_items: total,
    total_pages: pages,
  },
});

describe('Orders data preloader', () => {
  beforeEach(() => {
    mocks.listOrders.mockReset();
    clearOrdersSnapshot();
  });

  it('fetches every page before publishing a complete snapshot', async () => {
    mocks.listOrders.mockImplementation(async ({ page }) => {
      if (page === 1) return makePage(1, 100);
      if (page === 2) return makePage(2, 100);
      return makePage(3, 30);
    });

    const snapshot = await preloadOrders('admin-1');

    expect(snapshot.items).toHaveLength(230);
    expect(snapshot.totalOrders).toBe(230);
    expect(new Set(snapshot.items.map((order) => order.id)).size).toBe(230);
    expect(mocks.listOrders).toHaveBeenCalledTimes(3);
    expect(getOrdersSnapshot('admin-1')).toEqual(snapshot);
  });

  it('deduplicates concurrent preload calls for the same session', async () => {
    let resolveFirst;
    mocks.listOrders.mockImplementation(() => new Promise((resolve) => {
      resolveFirst = resolve;
    }));

    const first = preloadOrders('admin-2');
    const second = preloadOrders('admin-2');

    expect(mocks.listOrders).toHaveBeenCalledTimes(1);

    resolveFirst({
      data: [{ id: 'order-1', order_number: 'ORD-1' }],
      meta: {
        page: 1,
        page_size: 100,
        total_items: 1,
        total_pages: 1,
      },
    });

    const [firstSnapshot, secondSnapshot] = await Promise.all([first, second]);
    expect(firstSnapshot).toBe(secondSnapshot);
    expect(firstSnapshot.items).toHaveLength(1);
    expect(mocks.listOrders).toHaveBeenCalledTimes(1);
  });

  it('does not reuse order snapshots between authenticated session scopes', async () => {
    mocks.listOrders.mockImplementation(async () => ({
      data: [{ id: 'order-1', order_number: 'ORD-1' }],
      meta: {
        page: 1,
        page_size: 100,
        total_items: 1,
        total_pages: 1,
      },
    }));

    await preloadOrders('admin-A');
    await preloadOrders('admin-B');

    expect(mocks.listOrders).toHaveBeenCalledTimes(2);
    expect(getOrdersSnapshot('admin-A')?.items[0].id).toBe('order-1');
    expect(getOrdersSnapshot('admin-B')?.items[0].id).toBe('order-1');
  });

  it('does not cache a partial result when any page fails', async () => {
    mocks.listOrders.mockImplementation(async ({ page }) => {
      if (page === 2) throw new Error('Page two unavailable');
      return makePage(1, 100);
    });

    await expect(preloadOrders('admin-failure')).rejects.toThrow('Page two unavailable');
    expect(getOrdersSnapshot('admin-failure')).toBeNull();
  });
});
