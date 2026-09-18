import { describe, expect, it } from 'vitest';
import { canCancelOrder, canDownloadInvoice } from './order';

describe('order action eligibility', () => {
  it('keeps paid and processing orders cancellable', () => {
    expect(canCancelOrder('paid')).toBe(true);
    expect(canCancelOrder('processing')).toBe(true);
    expect(canCancelOrder('shipped')).toBe(false);
  });

  it('does not expose invoice downloads for refunded orders', () => {
    expect(canDownloadInvoice('refunded')).toBe(false);
    expect(canDownloadInvoice('paid')).toBe(true);
    expect(canDownloadInvoice('processing')).toBe(true);
    expect(canDownloadInvoice('delivered')).toBe(true);
  });
});
