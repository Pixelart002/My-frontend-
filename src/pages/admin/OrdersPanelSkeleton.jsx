const BASE_COLUMNS = [
  'Order',
  'Customer',
  'Items',
  'Status',
  'Payment',
  'Total',
  'Invoice',
  'Tracking',
  'Date',
];

export default function OrdersPanelSkeleton({ canUpdate = false }) {
  const columns = canUpdate
    ? [...BASE_COLUMNS, 'Fulfillment']
    : BASE_COLUMNS;

  return (
    <div
      className="orders-admin-full orders-loading-state w-full min-w-0 max-w-none"
      aria-busy="true"
      aria-describedby="orders-loading-status"
    >
      <span id="orders-loading-status" className="sr-only" role="status">
        Preparing the complete Orders list before displaying it.
      </span>

      <div className="admin-page-head flex w-full min-w-0 flex-col items-stretch gap-3 min-[901px]:flex-row min-[901px]:items-end min-[901px]:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 break-words">Orders</h1>
          <p className="admin-sub">Preparing complete order data…</p>
        </div>

        <div className="admin-toolbar orders-toolbar" aria-hidden="true">
          <div className="admin-search orders-search orders-skeleton-search">
            <span className="orders-skeleton-line orders-skeleton-search-line" />
          </div>
          <div className="orders-filter-actions">
            <span className="orders-skeleton-select" />
            <span className="orders-skeleton-refresh" />
          </div>
        </div>
      </div>

      <div className="admin-card orders-ledger-card w-full min-w-0 max-w-none">
        <div className="orders-ledger-scroll" aria-hidden="true">
          <div className="orders-ledger-track">
            <table className="admin-table orders-ledger-table">
              <thead>
                <tr>
                  {columns.map((label) => (
                    <th key={label} scope="col">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }, (_, row) => (
                  <tr key={`skeleton-row-${row}`}>
                    {columns.map((label, column) => (
                      <td key={label}>
                        <span
                          className="orders-skeleton-cell"
                          style={{
                            width: `${[56, 64, 78, 42, 34, 52, 60, 46, 68][column % 9]}%`,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="orders-pagination flex flex-wrap items-center justify-between gap-3 py-3">
        <span className="admin-sub">Loading order records before display…</span>
      </div>
    </div>
  );
}
