import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiRefreshLine, RiFileList3Line } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';

const text = (value) => value === null || value === undefined || value === '' ? '—' : String(value);

export default function AuditLogsPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('all');
  const [status, setStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(itemsOfList(await adminService.auditLogs(200)));
    } catch (error) {
      toast.error(error.message || 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => rows.filter((row) => {
    const methodMatch = method === 'all' || String(row.method || '').toUpperCase() === method;
    const statusCode = Number(row.status_code || 0);
    const statusMatch = status === 'all' || (status === 'success' ? statusCode >= 200 && statusCode < 400 : statusCode >= 400);
    return methodMatch && statusMatch;
  }), [rows, method, status]);

  return (
    <section className="admin-panel">
      <div className="admin-card">
        <div className="admin-toolbar ops-toolbar">
          <div><h2>Audit Logs</h2><p>Server-generated mutation telemetry for security and operational review.</p></div>
          <button type="button" className="btn btn-quiet btn-sm" onClick={load} disabled={loading}>
            <RiRefreshLine size={16} /> {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <div className="admin-stats">
          <div className="admin-stat"><div className="stat-label">Entries</div><div className="stat-value">{loading ? '…' : rows.length}</div></div>
          <div className="admin-stat"><div className="stat-label">Successful</div><div className="stat-value">{loading ? '…' : rows.filter((r) => Number(r.status_code) >= 200 && Number(r.status_code) < 400).length}</div></div>
          <div className="admin-stat"><div className="stat-label">Errors</div><div className="stat-value">{loading ? '…' : rows.filter((r) => Number(r.status_code) >= 400).length}</div></div>
        </div>
        <div className="ops-inline">
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Filter HTTP method">
            <option value="all">All methods</option><option value="POST">POST</option><option value="PATCH">PATCH</option><option value="PUT">PUT</option><option value="DELETE">DELETE</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            <option value="all">All results</option><option value="success">2xx / 3xx</option><option value="error">4xx / 5xx</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th><th>Actor</th><th>Request ID</th></tr></thead>
          <tbody>
            {filtered.length ? filtered.map((row) => {
              const code = Number(row.status_code || 0);
              return <tr key={row.id}>
                <td>{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</td>
                <td className="td-strong">{text(row.method).toUpperCase()}</td>
                <td title={text(row.path)}><span className="ops-path">{text(row.path)}</span></td>
                <td><span className={`admin-pill ${code >= 400 ? 'pill-danger' : 'pill-success'}`}>{text(row.status_code)}</span></td>
                <td>{text(row.duration_ms)} ms</td>
                <td>{text(row.actor_user_id).slice(0, 12)}</td>
                <td>{text(row.request_id).slice(0, 12)}</td>
              </tr>;
            }) : <tr><td colSpan="7"><div className="admin-empty">{loading ? 'Loading audit logs…' : 'No audit entries match the selected filters.'}</div></td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
