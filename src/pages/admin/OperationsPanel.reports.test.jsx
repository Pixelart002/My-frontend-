import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({
  reports: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('../../services/admin', () => ({
  adminService: {
    reports: mocks.reports,
  },
  itemsOfList: vi.fn((value) => (Array.isArray(value) ? value : [])),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    toast: {
      error: mocks.toastError,
      success: mocks.toastSuccess,
    },
  }),
}));

import OperationsPanel from './OperationsPanel';

describe('Reports panel layout', () => {
  it('keeps the report content in one card with an inline refresh action', () => {
    const markup = renderToStaticMarkup(
      <OperationsPanel section="reports" />,
    );
    const cards = markup.match(/class="admin-card/g) ?? [];

    expect(cards).toHaveLength(1);
    expect(markup).toContain('class="reports-description"');
    expect(markup).toContain('aria-label="Refresh Reports"');
    expect(markup).toContain('Order status');
    expect(markup).toContain('Top products');
    expect(markup).not.toContain('reports-visual-card');
    expect(markup).not.toContain('<h2>Reports</h2>');
  });
});
