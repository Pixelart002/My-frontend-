import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  stats: vi.fn(),
  listOrders: vi.fn(),
  listProducts: vi.fn(),
  lowStock: vi.fn(),
  paymentsReport: vi.fn(),
  auditLogs: vi.fn(),
  pushStats: vi.fn(),
  settings: vi.fn(),
}));

vi.mock('../../services/admin', () => ({
  adminService: {
    stats: mocks.stats,
    listOrders: mocks.listOrders,
    listProducts: mocks.listProducts,
    lowStock: mocks.lowStock,
    paymentsReport: mocks.paymentsReport,
    auditLogs: mocks.auditLogs,
    pushStats: mocks.pushStats,
    settings: mocks.settings,
  },
  itemsOfList: (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.results)) return value.results;
    if (value?.data && typeof value.data === 'object') {
      return Array.isArray(value.data)
        ? value.data
        : Array.isArray(value.data.items)
          ? value.data.items
          : [];
    }
    return [];
  },
}));

import DashboardPanel from './DashboardPanel';

describe('DashboardPanel consolidated summaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.stats.mockResolvedValue({
      stats: {
        products: 4,
        orders: 225,
        pending_orders: 40,
        users: 9,
        revenue: 60775.54,
      },
    });
    mocks.listOrders.mockResolvedValue([
      { id: 'order-1', order_number: 'ORD-1', status: 'pending', total_amount: 100, created_at: '2026-01-01T00:00:00Z' },
      { id: 'order-2', order_number: 'ORD-2', status: 'paid', total_amount: 200, created_at: '2026-01-02T00:00:00Z' },
    ]);
    mocks.listProducts.mockResolvedValue([
      { id: 'product-1', stock: 5 },
      { id: 'product-2', stock: 12 },
      { id: 'product-3', stock: 0 },
      { id: 'product-4', stock: 3 },
    ]);
    mocks.lowStock.mockResolvedValue([{ id: 'product-1' }, { id: 'product-4' }]);
    mocks.paymentsReport.mockResolvedValue([
      { id: 'payment-1', amount: 100, status: 'succeeded' },
      { id: 'payment-2', amount: 75, status: 'failed' },
      { id: 'payment-3', amount: 25, status: 'pending' },
    ]);
    mocks.auditLogs.mockResolvedValue([
      { id: 'audit-1', status_code: 200 },
      { id: 'audit-2', status_code: 404 },
      { id: 'audit-3', status_code: 500 },
    ]);
    mocks.pushStats.mockResolvedValue({
      total_subscriptions: 12,
      unique_users: 9,
      vapid_configured: true,
    });
    mocks.settings.mockResolvedValue({
      items: [{ key: 'stripe_publishable_key', value: 'pk_live_AbC123' }],
    });
  });

  it('shows data-only admin summaries on the dashboard', async () => {
    render(<DashboardPanel />);

    await waitFor(() => {
      expect(screen.getByText('Inventory snapshot')).toBeTruthy();
      expect(screen.getByText('Payment activity')).toBeTruthy();
      expect(screen.getByText('Audit activity')).toBeTruthy();
      expect(screen.getByText('Customer notifications')).toBeTruthy();
      expect(screen.getByText('Payment gateway configuration')).toBeTruthy();
    });

    expect(screen.getByText('Units on hand')).toBeTruthy();
    expect(screen.getByText('Out of stock')).toBeTruthy();
    expect(screen.getByText('Recent attempts')).toBeTruthy();
    expect(screen.getByText('Recent event value')).toBeTruthy();
    expect(screen.getByText('Needs attention')).toBeTruthy();
    expect(screen.getByText('Subscribed devices')).toBeTruthy();
    expect(screen.getByText('Subscribed customers')).toBeTruthy();
    expect(screen.getByText('Push configuration')).toBeTruthy();
    expect(screen.getByText('Status')).toBeTruthy();
    expect(screen.getByText('Mode')).toBeTruthy();
    expect(screen.getByText('Storage')).toBeTruthy();
    expect(mocks.auditLogs).toHaveBeenCalledWith(200);
    expect(mocks.settings).toHaveBeenCalledWith('financial');
  });

  it('keeps dashboard summaries resilient when one overview endpoint fails', async () => {
    mocks.pushStats.mockRejectedValue(new Error('Push stats unavailable'));

    render(<DashboardPanel />);

    await waitFor(() => {
      expect(screen.getByText('Temporarily unavailable')).toBeTruthy();
    });

    expect(screen.getByText('Payment activity')).toBeTruthy();
    expect(screen.getByText('Inventory snapshot')).toBeTruthy();
  });
});
