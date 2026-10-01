import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiCalendarLine,
  RiMoneyRupeeCircleLine,
  RiShoppingBag3Line,
} from '@remixicon/react';
import { orderService } from '../services/orders';
import {
  orderStatusLabel,
  orderStatusTone,
} from '../utils/order';
import { formatMoney } from '../utils/format';
import Pagination from '../components/ui/Pagination';
import {
  Spinner,
  ErrorState,
  EmptyState,
} from '../components/ui/States';

const STATUS_OPTIONS = [
  '',
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const PAGE_SIZE = 10;

function text(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  const result = String(value).trim();
  
  return result || fallback;
}

function formatOrderDate(value) {
  if (!value) return '—';
  
  const date = new Date(value);
  
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function normalizeOrders(value) {
  const items = Array.isArray(value) ?
    value :
    Array.isArray(value?.items) ?
    value.items :
    [];
  
  const seen = new Set();
  
  return items.filter((order) => {
    if (!order || typeof order !== 'object') {
      return false;
    }
    
    const orderNumber = text(order.order_number);
    
    if (!orderNumber || seen.has(orderNumber)) {
      return false;
    }
    
    seen.add(orderNumber);
    
    return true;
  });
}

function normalizeTotalPages(value) {
  const total = Number(value);
  
  return Number.isInteger(total) && total > 0 ?
    total :
    1;
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  
  const mountedRef = useRef(false);
  const requestVersion = useRef(0);
  
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    
    setData(null);
    setError('');
    
    try {
      const result = await orderService.myOrders(
        page,
        PAGE_SIZE,
        status || null,
      );
      
      if (
        !mountedRef.current ||
        version !== requestVersion.current
      ) {
        return;
      }
      
      setData(result);
    } catch (err) {
      if (
        !mountedRef.current ||
        version !== requestVersion.current
      ) {
        return;
      }
      
      setError(
        err?.message ||
        'Unable to load your orders. Please try again.',
      );
    }
  }, [page, status]);
  
  useEffect(() => {
    mountedRef.current = true;
    
    load();
    
    return () => {
      mountedRef.current = false;
      requestVersion.current += 1;
    };
  }, [load]);
  
  const orders = normalizeOrders(data);
  
  const totalPages = normalizeTotalPages(
    data?.meta?.total_pages,
  );
  
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };
  
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 sm:mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Your account</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">Orders</h1>
            <p className="mt-2 text-sm leading-6 text-muted">Track purchases, payment status and delivery progress.</p>
          </div>
          <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" to="/shop">
            Continue shopping
            <RiArrowRightLine size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section
        className="mb-5 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
        aria-label="Order filters"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-dim text-gold" aria-hidden="true">
            <RiShoppingBag3Line size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">Order history</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">Filter your purchases by status.</p>
          </div>
        </div>
        <div className="relative w-full sm:w-52">
          <label className="sr-only" htmlFor="order-status-filter">Filter orders by status</label>
          <select
            className="min-h-11 w-full appearance-none rounded-xl border border-line bg-bg px-3 pr-10 text-sm font-semibold text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
            id="order-status-filter"
            value={status}
            onChange={handleStatusChange}
          >
            {STATUS_OPTIONS.map((value) => (
              <option key={value || 'all'} value={value}>
                {value ? orderStatusLabel(value) : 'All statuses'}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted" aria-hidden="true">⌄</span>
        </div>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : data === null ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-line bg-surface" role="status" aria-live="polite">
          <Spinner label="Loading orders…" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          message="When you place an order it will appear here."
          action={
            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-5 text-sm font-bold text-gold-ink transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" to="/shop">
              Start shopping
            </Link>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-luviio-card" role="list" aria-label="Your orders">
            <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px_120px_36px] items-center gap-4 border-b border-line bg-surface-2 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:grid">
              <span className="flex items-center gap-2"><RiShoppingBag3Line size={14} aria-hidden="true" />Order</span>
              <span className="flex items-center gap-2"><RiCalendarLine size={14} aria-hidden="true" />Date</span>
              <span className="flex items-center justify-end gap-2"><RiMoneyRupeeCircleLine size={14} aria-hidden="true" />Amount</span>
              <span>Status</span>
              <span aria-hidden="true" />
            </div>
            {orders.map((order) => {
              const orderNumber = text(order.order_number);
              const statusValue = text(order.status, 'pending').toLowerCase();
              const tone = orderStatusTone(statusValue);
              const statusClass =
                tone === 'success'
                  ? 'bg-success-dim text-success'
                  : tone === 'danger'
                    ? 'bg-danger-dim text-danger'
                    : 'bg-gold-dim text-gold';

              return (
                <Link
                  to={`/orders/${encodeURIComponent(orderNumber)}`}
                  className="group grid gap-3 border-b border-line px-4 py-4 transition last:border-b-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold sm:grid-cols-[minmax(0,1fr)_140px_120px_120px_36px] sm:items-center sm:gap-4 sm:px-5 sm:py-4"
                  key={orderNumber}
                  role="listitem"
                  aria-label={`Order ${orderNumber}, ${orderStatusLabel(statusValue)}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-muted sm:flex" aria-hidden="true">
                          <RiShoppingBag3Line size={17} />
                        </span>
                        <span className="min-w-0">
                          <strong className="block truncate text-sm font-semibold text-text sm:text-base">#{orderNumber}</strong>
                          <span className="mt-0.5 block text-xs text-muted sm:hidden">{formatOrderDate(order.created_at)}</span>
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass} sm:hidden`}>
                        {orderStatusLabel(statusValue)}
                      </span>
                    </div>
                  </div>
                  <span className="hidden text-sm text-muted sm:block">{formatOrderDate(order.created_at)}</span>
                  <span className="text-sm font-bold tabular-nums text-text sm:text-right">{formatMoney(order.total_amount ?? order.grand_total ?? 0)}</span>
                  <span className={`hidden w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass} sm:inline-flex`}>
                    {orderStatusLabel(statusValue)}
                  </span>
                  <span className="hidden items-center justify-center text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-gold sm:flex" aria-hidden="true">
                    <RiArrowRightLine size={18} />
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mt-5">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}
    </main>
  );
}
