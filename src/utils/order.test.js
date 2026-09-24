import { describe, expect, it } from 'vitest';

import {
  canCancelOrder,
  canDownloadInvoice,
  orderStatusLabel,
  orderStatusTone,
} from './order';

describe('order action eligibility', () => {
  it('keeps backend-cancellable statuses cancellable', () => {
    expect(canCancelOrder('pending')).toBe(true);
    expect(canCancelOrder('paid')).toBe(true);
    expect(canCancelOrder('processing')).toBe(true);
    
    expect(canCancelOrder('shipped')).toBe(false);
    expect(canCancelOrder('delivered')).toBe(false);
    expect(canCancelOrder('cancelled')).toBe(false);
    expect(canCancelOrder('refunded')).toBe(false);
  });
  
  it('normalizes order status before checking cancellation', () => {
    expect(canCancelOrder(' PAID ')).toBe(true);
    expect(canCancelOrder('Processing')).toBe(true);
    expect(canCancelOrder('SHIPPED')).toBe(false);
    expect(canCancelOrder(null)).toBe(false);
    expect(canCancelOrder(undefined)).toBe(false);
  });
  
  it('does not expose invoice downloads for refunded orders', () => {
    expect(canDownloadInvoice('refunded')).toBe(false);
    expect(canDownloadInvoice('paid')).toBe(true);
    expect(canDownloadInvoice('processing')).toBe(true);
    expect(canDownloadInvoice('shipped')).toBe(true);
    expect(canDownloadInvoice('delivered')).toBe(true);
  });
  
  it('normalizes order status before checking invoice availability', () => {
    expect(canDownloadInvoice(' PAID ')).toBe(true);
    expect(canDownloadInvoice('Delivered')).toBe(true);
    expect(canDownloadInvoice('REFUNDED')).toBe(false);
    expect(canDownloadInvoice(null)).toBe(false);
  });
});

describe('order status presentation', () => {
  it('returns the correct label for known statuses', () => {
    expect(orderStatusLabel('pending')).toBe('Pending');
    expect(orderStatusLabel('paid')).toBe('Paid');
    expect(orderStatusLabel('delivered')).toBe('Delivered');
  });
  
  it('normalizes known status labels', () => {
    expect(orderStatusLabel(' PAID ')).toBe('Paid');
    expect(orderStatusLabel('Delivered')).toBe('Delivered');
  });
  
  it('returns Unknown for missing status', () => {
    expect(orderStatusLabel(null)).toBe('Unknown');
    expect(orderStatusLabel(undefined)).toBe('Unknown');
    expect(orderStatusLabel('')).toBe('Unknown');
  });
  
  it('preserves an unknown non-empty status for diagnostics', () => {
    expect(orderStatusLabel('awaiting_pickup'))
      .toBe('awaiting_pickup');
  });
  
  it('falls back to muted tone for unknown statuses', () => {
    expect(orderStatusTone('awaiting_pickup'))
      .toBe('muted');
    
    expect(orderStatusTone(null))
      .toBe('muted');
  });
  
  it('normalizes status tones', () => {
    expect(orderStatusTone(' PAID '))
      .toBe('info');
    
    expect(orderStatusTone('Delivered'))
      .toBe('success');
    
    expect(orderStatusTone('SHIPPED'))
      .toBe('gold');
  });
});