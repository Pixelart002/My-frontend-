import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiRefreshLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { formatMoney } from '../../utils/format';
import '../../styles/admin-telemetry.css';

const text = (value) => value === null || value === undefined || value === '' ? '—' : String(value);
const money = (value) => formatMoney(Number(value || 0));

function paymentState(value) {
  const status = String(value || 'unknown').toLowerCase();
  if (status === 'succeeded' || status === 'paid') return { key: 'succeeded', label: status };
  if (status === 'requires_payment_method' || status === 'failed' || status === 'canceled' || status === 'cancelled') {
    return { key: 'failed', label: status };
  }
  return { key: 'pending', label: status };
}

export default function PaymentsPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(itemsOfList(await adminService.paymentsReport())); }
    catch (error) { toast.error(error.message || 'Unable to load payment report.'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => rows.reduce((acc, row) => {
    const state = paymentState(row.status);
    acc.count += 1;
    acc.amount += Number(row.amount || 0);
    acc[state.key] += 1;
    return acc;
  }, { count: 0, amount: 0, succeeded: 0, failed: 0, pending: 0 }), [rows]);

  return <section className="admin-panel">
    <div className="admin-card admin-telemetry-card">
      <div className="admin-toolbar ops-toolbar"><div><h2>Payments</h2><p>Payment attempts, status, amount and linked order telemetry.</p></div><button type="button" className="btn btn-quiet btn-sm" onClick={load} disabled={loading}><RiRefreshLine size={16}/>{loading?'Loading…':'Refresh'}</button></div>
      <div className="admin-stats">
        <div className="admin-stat"><div className="stat-label">Attempts loaded</div><div className="stat-value">{loading?'…':summary.count}</div></div>
        <div className="admin-stat"><div className="stat-label">Amount tracked</div><div className="stat-value">{loading?'…':money(summary.amount)}</div></div>
        <div className="admin-stat"><div className="stat-label">Succeeded</div><div className="stat-value">{loading?'…':summary.succeeded}</div></div>
        <div className="admin-stat"><div className="stat-label">Failed</div><div className="stat-value">{loading?'…':summary.failed}</div></div>
      </div>
    </div>
    <div className="admin-table-wrap"><table className="admin-table admin-telemetry-table"><thead><tr><th>Payment</th><th>Order</th><th>Method</th><th>Amount</th><th>Status</th><th>Attempt</th><th>Created</th></tr></thead><tbody>{rows.length?rows.map((row)=>{const order=Array.isArray(row.orders)?row.orders[0]:row.orders;const state=paymentState(row.status);return <tr key={row.id}><td className="td-strong">{text(row.id).slice(0,12)}</td><td>{text(order?.order_number||row.order_id).slice(0,18)}</td><td>{text(row.payment_method)}</td><td className="td-gold">{money(row.amount)} {text(row.currency).toUpperCase()}</td><td><span className={`admin-pill ${state.key==='succeeded'?'pill-success':state.key==='failed'?'pill-danger':'pill-muted'}`}>{state.label}</span></td><td>{text(row.attempt_number)} / {text(row.total_attempts)}</td><td>{row.created_at?new Date(row.created_at).toLocaleString():'—'}</td></tr>}) : <tr><td colSpan="7"><div className="admin-empty">{loading?'Loading payment telemetry…':'No payment records found.'}</div></td></tr>}</tbody></table></div>
  </section>;
}
