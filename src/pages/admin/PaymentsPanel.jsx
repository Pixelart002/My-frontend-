import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiRefreshLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { formatMoney } from '../../utils/format';
import '../../styles/admin-telemetry.css';

const PAGE_SIZE = 50;
const MAX_ALLOWED_PAYMENT_ATTEMPTS = 5;
const text = (value) => value === null || value === undefined || value === '' ? '—' : String(value);
const money = (value) => formatMoney(Number(value || 0));
const json = (value) => {
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return '—';
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
};

function paymentState(value, paymentMethod, orderStatus) {
  const status = String(value || 'unknown').toLowerCase();
  const method = String(paymentMethod || '').toLowerCase();
  const order = String(orderStatus || '').toLowerCase();
  if (method === 'cod' && ['paid', 'processing', 'shipped', 'delivered'].includes(order)) return { key: 'succeeded', label: 'paid' };
  if (status === 'succeeded' || status === 'paid') return { key: 'succeeded', label: status };
  if (status === 'expired') return { key: 'expired', label: 'expired' };
  if (status === 'requires_payment_method') return { key: 'pending', label: 'requires payment method' };
  if (['failed', 'canceled', 'cancelled'].includes(status)) return { key: 'failed', label: status };
  return { key: 'pending', label: status };
}

function attemptNumber(row) {
  const number = Number(row?.attempt_number);
  return Number.isInteger(number) && number >= 1 ? number : null;
}

function maxAttempts(row) {
  const number = Number(row?.max_attempts);
  return Number.isInteger(number) && number > 0 ? number : MAX_ALLOWED_PAYMENT_ATTEMPTS;
}

function pageData(response) {
  const data = response?.data && typeof response.data === 'object' ? response.data : response;
  return { items: itemsOfList(data), hasMore: Boolean(data?.has_more), nextOffset: Number.isInteger(data?.next_offset) ? data.next_offset : 0 };
}

function groupByOrder(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = String(row?.order_id || row?.order_number || row?.id || 'unknown');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.entries()].map(([key, events]) => ({
    key,
    events: [...events].sort((a, b) => {
      const aa = attemptNumber(a) ?? 0;
      const ba = attemptNumber(b) ?? 0;
      if (aa !== ba) return aa - ba;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }),
  }));
}

function Detail({ label, value, mono = false }) {
  return <div className="payment-detail"><span>{label}</span><strong className={mono ? 'payment-detail-mono' : ''}>{value}</strong></div>;
}

function Attempt({ row, index, total }) {
  const state = paymentState(row.status, row.payment_method, row.order_status);
  const statusClass = state.key === 'succeeded' ? 'pill-success' : state.key === 'failed' ? 'pill-danger' : state.key === 'expired' ? 'pill-warning' : 'pill-muted';
  const attempt = attemptNumber(row);
  const created = row.created_at ? new Date(row.created_at).toLocaleString() : '—';
  const updated = row.updated_at ? new Date(row.updated_at).toLocaleString() : '—';
  const metadata = json(row.gateway_metadata);

  return <article className="payment-attempt-card">
    <div className="payment-attempt-head">
      <div className="payment-attempt-number"><span>{index + 1}.</span><div><strong>Attempt {attempt ? `#${attempt}` : `#${index + 1}`}</strong><small>{index + 1} of {total}</small></div></div>
      <span className={`admin-pill ${statusClass}`}>{state.label}</span>
    </div>
    <div className="payment-detail-grid">
      <Detail label="Amount" value={money(row.amount)} />
      <Detail label="Payment method" value={text(row.payment_method).toUpperCase()} />
      <Detail label="Max attempts" value={maxAttempts(row)} />
      <Detail label="Created" value={created} />
      <Detail label="Updated" value={updated} />
      <Detail label="Error code" value={text(row.error_code)} mono />
    </div>
    <div className="payment-detail-block"><span>Stripe PaymentIntent</span><code>{text(row.stripe_payment_intent_id)}</code></div>
    {row.error_message && <div className="payment-detail-block"><span>Error message</span><p>{text(row.error_message)}</p></div>}
    <div className="payment-detail-grid">
      <Detail label="Client IP" value={text(row.ip_address)} mono />
      <Detail label="User agent" value={text(row.user_agent)} mono />
    </div>
    <details className="payment-gateway-details">
      <summary>Gateway metadata</summary>
      <pre>{metadata}</pre>
    </details>
  </article>;
}

function OrderCard({ group }) {
  const first = group.events[0] || {};
  const order = text(first.order_number || first.order_id);
  const total = group.events.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const max = maxAttempts(first);
  const latest = group.events[group.events.length - 1] || first;
  const latestState = paymentState(latest.status, latest.payment_method, latest.order_status);

  return <section className="payment-order-card">
    <header className="payment-order-header">
      <div><p className="payment-section-eyebrow">Order information</p><h3>{order}</h3><div className="payment-order-meta"><span>{group.events.length} attempt{group.events.length === 1 ? '' : 's'}</span><span>Limit {max}</span><span>{text(first.order_status).toUpperCase()}</span></div></div>
      <div className="payment-order-summary"><strong>{money(first.total_amount ?? first.amount)}</strong><span>Latest: {latestState.label}</span></div>
    </header>
    <div className="payment-attempt-list">{group.events.map((row, index) => <Attempt key={`${group.key}:${row.id || index}`} row={row} index={index} total={group.events.length} />)}</div>
  </section>;
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
    if (pageOffset > 0) { loadingMoreRef.current = true; setLoadingMore(true); } else setLoading(true);
    try {
      const result = pageData(await adminService.paymentsReport({ limit: PAGE_SIZE, offset: pageOffset }));
      setRows((current) => replace || pageOffset === 0 ? result.items : [...current, ...result.items]);
      setHasMore(result.hasMore);
      setOffset(result.nextOffset);
    } catch (error) {
      toast.error(error.message || 'Unable to load payment report.');
    } finally {
      if (pageOffset > 0) { loadingMoreRef.current = false; setLoadingMore(false); } else setLoading(false);
    }
  }, [toast]);

  const refresh = useCallback(() => { setHasMore(true); setOffset(0); loadingMoreRef.current = false; return loadPage(0, true); }, [loadPage]);
  useEffect(() => { loadPage(0, true); }, [loadPage]);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return undefined;
    const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting && !loading && !loadingMoreRef.current) loadPage(offset); }, { rootMargin: '320px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, loadPage]);

  const orderGroups = useMemo(() => groupByOrder(rows), [rows]);
  const summary = useMemo(() => rows.reduce((acc, row) => {
    const state = paymentState(row.status, row.payment_method, row.order_status);
    acc.events += 1; acc.amount += Number(row.amount || 0); acc[state.key] += 1; return acc;
  }, { events: 0, amount: 0, succeeded: 0, failed: 0, expired: 0, pending: 0 }), [rows]);

  return <section className="admin-panel">
    <div className="admin-card admin-telemetry-card">
      <div className="admin-toolbar ops-toolbar"><div><h2>Payments</h2><p>Order-wise payment history with individual attempt and gateway telemetry.</p></div><button type="button" className="btn btn-quiet btn-sm" onClick={refresh} disabled={loading || loadingMore}><RiRefreshLine size={16}/>{loading ? 'Loading…' : loadingMore ? 'Loading more…' : 'Refresh'}</button></div>
      <div className="admin-stats"><div className="admin-stat"><div className="stat-label">Attempt events</div><div className="stat-value">{loading ? '…' : summary.events}</div></div><div className="admin-stat"><div className="stat-label">Event value</div><div className="stat-value">{loading ? '…' : money(summary.amount)}</div></div><div className="admin-stat"><div className="stat-label">Succeeded</div><div className="stat-value">{loading ? '…' : summary.succeeded}</div></div><div className="admin-stat"><div className="stat-label">Failed</div><div className="stat-value">{loading ? '…' : summary.failed}</div></div></div>
    </div>
    <div className="payment-orders-list">
      {orderGroups.length ? orderGroups.map((group) => <OrderCard key={group.key} group={group}/>) : <div className="admin-empty">{loading ? 'Loading payment activity…' : 'No payment records found.'}</div>}
    </div>
    <div ref={sentinelRef} aria-hidden="true" style={{ minHeight: 1 }} />
    {loadingMore && <div className="admin-empty" role="status">Loading more payment records…</div>}
    {!hasMore && rows.length > 0 && <div className="admin-empty">All payment records loaded.</div>}
  </section>;
}
