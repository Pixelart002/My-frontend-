import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiRefreshLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { formatMoney } from '../../utils/format';
import '../../styles/admin-telemetry.css';

const PAGE_SIZE = 10;
const MAX_ALLOWED_PAYMENT_ATTEMPTS = 5;
const text = (value) => value === null || value === undefined || value === '' ? '—' : String(value);
const money = (value) => formatMoney(Number(value || 0));

function paymentState(value, paymentMethod, orderStatus) {
  const status = String(value || 'unknown').toLowerCase();
  const method = String(paymentMethod || '').toLowerCase();
  const order = String(orderStatus || '').toLowerCase();

  // COD is settled by the store, not by Stripe. A completed COD order is paid
  // even if an old/stale payment row still contains a Stripe-style status.
  if (method === 'cod' && ['paid', 'processing', 'shipped', 'delivered'].includes(order)) {
    return { key: 'succeeded', label: 'paid' };
  }
  if (status === 'succeeded' || status === 'paid') return { key: 'succeeded', label: status };
  if (status === 'requires_payment_method' || status === 'failed' || status === 'canceled' || status === 'cancelled') return { key: 'failed', label: status };
  return { key: 'pending', label: status };
}

function pageData(response) {
  const data = response?.data && typeof response.data === 'object' ? response.data : response;
  return { items: itemsOfList(data), hasMore: Boolean(data?.has_more), nextOffset: Number.isInteger(data?.next_offset) ? data.next_offset : 0 };
}

export default function PaymentsPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef(null);

  const loadPage = useCallback(async (pageOffset = 0, replace = false) => {
    if (pageOffset > 0 && loadingMoreRef.current) return;
    if (pageOffset > 0) {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else setLoading(true);
    try {
      const result = pageData(await adminService.paymentsReport({ limit: PAGE_SIZE, offset: pageOffset }));
      setRows((current) => replace || pageOffset === 0 ? result.items : [...current, ...result.items]);
      setHasMore(result.hasMore);
      setOffset(result.nextOffset);
    } catch (error) {
      toast.error(error.message || 'Unable to load payment report.');
    } finally {
      if (pageOffset > 0) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      } else setLoading(false);
    }
  }, [toast]);

  const refresh = useCallback(() => {
    setHasMore(true);
    setOffset(0);
    loadingMoreRef.current = false;
    return loadPage(0, true);
  }, [loadPage]);

  useEffect(() => { loadPage(0, true); }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loading && !loadingMoreRef.current) loadPage(offset);
    }, { rootMargin: '320px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, loadPage]);

  const summary = useMemo(() => rows.reduce((acc, row) => {
    const state = paymentState(row.status, row.payment_method, row.order_status);
    acc.count += 1;
    acc.amount += Number(row.amount || 0);
    acc[state.key] += 1;
    return acc;
  }, { count: 0, amount: 0, succeeded: 0, failed: 0, pending: 0 }), [rows]);

  return <section className="admin-panel">
    <div className="admin-card admin-telemetry-card">
      <div className="admin-toolbar ops-toolbar"><div><h2>Payments</h2><p>Payment attempts, COD orders, status, amount and linked order telemetry.</p></div><button type="button" className="btn btn-quiet btn-sm" onClick={refresh} disabled={loading || loadingMore}><RiRefreshLine size={16}/>{loading?'Loading…':loadingMore?'Loading more…':'Refresh'}</button></div>
      <div className="admin-stats">
        <div className="admin-stat"><div className="stat-label">Transactions loaded</div><div className="stat-value">{loading?'…':summary.count}</div></div>
        <div className="admin-stat"><div className="stat-label">Transaction value</div><div className="stat-value">{loading?'…':money(summary.amount)}</div></div>
        <div className="admin-stat"><div className="stat-label">Succeeded</div><div className="stat-value">{loading?'…':summary.succeeded}</div></div>
        <div className="admin-stat"><div className="stat-label">Failed</div><div className="stat-value">{loading?'…':summary.failed}</div></div>
      </div>
    </div>
    <div className="admin-table-wrap"><table className="admin-table admin-telemetry-table"><thead><tr><th>Payment</th><th>Order</th><th>Method</th><th>Amount</th><th>Status</th><th>Attempt (Made / Allowed)</th><th>Created</th></tr></thead><tbody>{rows.length?rows.map((row)=>{const state=paymentState(row.status, row.payment_method, row.order_status);const attemptsMade=Math.max(1, Number(row.total_attempts) || Number(row.attempt_number) || 1);return <tr key={`${row.payment_method||'payment'}:${row.id}`}><td className="td-strong">{text(row.id).slice(0,12)}</td><td>{text(row.order_number||row.order_id).slice(0,18)}</td><td><span className="admin-pill pill-muted">{text(row.payment_method).toUpperCase()}</span></td><td className="td-gold">{money(row.amount)} {text(row.currency).toUpperCase()}</td><td><span className={`admin-pill ${state.key==='succeeded'?'pill-success':state.key==='failed'?'pill-danger':'pill-muted'}`}>{state.label}</span></td><td>{attemptsMade} / {MAX_ALLOWED_PAYMENT_ATTEMPTS}</td><td>{row.created_at?new Date(row.created_at).toLocaleString():'—'}</td></tr>}) : <tr><td colSpan="7"><div className="admin-empty">{loading?'Loading payment telemetry…':'No payment records found.'}</div></td></tr>}</tbody></table></div>
    <div ref={sentinelRef} aria-hidden="true" style={{ minHeight: 1 }} />
    {loadingMore && <div className="admin-empty" role="status">Loading more payment records…</div>}
    {!hasMore && rows.length > 0 && <div className="admin-empty">All payment records loaded.</div>}
  </section>;
}
