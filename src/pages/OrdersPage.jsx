import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="page container">
      <div className="page-heading compact">
        <p className="eyebrow">Your account</p>

        <h1>Order history.</h1>
      </div>

      <div className="orders-toolbar">
        <label
          className="sr-only"
          htmlFor="order-status-filter"
        >
          Filter orders by status
        </label>

        <select
          id="order-status-filter"
          value={status}
          onChange={handleStatusChange}
          aria-label="Filter orders by status"
        >
          {STATUS_OPTIONS.map((value) => (
            <option
              key={value || 'all'}
              value={value}
            >
              {value
                ? orderStatusLabel(value)
                : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState
          message={error}
          onRetry={load}
        />
      ) : data === null ? (
        <div
          role="status"
          aria-live="polite"
        >
          <Spinner label="Loading orders…" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          message="When you place an order it will appear here."
          action={
            <Link
              className="btn"
              to="/shop"
            >
              Start shopping
            </Link>
          }
        />
      ) : (
        <>
          <div
            className="orders-list"
            role="list"
            aria-label="Your orders"
          >
            {orders.map((order) => {
              const orderNumber = text(
                order.order_number,
              );

              const statusValue = text(
                order.status,
                'pending',
              ).toLowerCase();

              return (
                <Link
                  to={`/orders/${encodeURIComponent(
                    orderNumber,
                  )}`}
                  className="order-row"
                  key={orderNumber}
                  role="listitem"
                  aria-label={`Order ${orderNumber}, ${orderStatusLabel(
                    statusValue,
                  )}`}
                >
                  <div>
                    <strong>
                      #{orderNumber}
                    </strong>

                    <span>
                      {formatOrderDate(
                        order.created_at,
                      )}
                    </span>
                  </div>

                  <div className="order-amount">
                    {formatMoney(
                      order.total_amount ??
                        order.grand_total ??
                        0,
                    )}
                  </div>

                  <span
                    className={`status-pill tone-${orderStatusTone(
                      statusValue,
                    )}`}
                  >
                    {orderStatusLabel(
                      statusValue,
                    )}
                  </span>
                </Link>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}