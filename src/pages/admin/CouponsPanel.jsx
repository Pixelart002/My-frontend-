import { useCallback, useEffect, useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiEditLine, RiRefreshLine } from '@remixicon/react';
import { adminService } from '../../services/admin';
import { formatMoney } from '../../utils/format';

const emptyForm = {
  code: '', type: 'percent', value: '', min_order_amount: '0', max_discount: '',
  valid_from: '', valid_until: '', usage_limit: '', per_user_limit: '1', is_active: true, description: '',
};

function toPayload(form) {
  const payload = {
    code: form.code.trim().toUpperCase(),
    type: form.type,
    value: Number(form.value),
    min_order_amount: Number(form.min_order_amount || 0),
    per_user_limit: Number(form.per_user_limit || 1),
    is_active: Boolean(form.is_active),
    description: form.description.trim(),
  };
  if (form.max_discount !== '') payload.max_discount = Number(form.max_discount);
  if (form.valid_from) payload.valid_from = new Date(form.valid_from).toISOString();
  if (form.valid_until) payload.valid_until = new Date(form.valid_until).toISOString();
  if (form.usage_limit !== '') payload.usage_limit = Number(form.usage_limit);
  return payload;
}

export default function CouponsPanel() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await adminService.listCoupons({ page: 1, page_size: 100 });
      setCoupons(Array.isArray(result?.items) ? result.items : []);
    } catch (err) { setError(err?.message || 'Unable to load coupons.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const openCreate = () => { setEditing(null); setForm(emptyForm); };
  const openEdit = (coupon) => setForm({ ...emptyForm, ...coupon, value: String(coupon.value), min_order_amount: String(coupon.min_order_amount ?? 0), max_discount: coupon.max_discount == null ? '' : String(coupon.max_discount), usage_limit: coupon.usage_limit == null ? '' : String(coupon.usage_limit), per_user_limit: String(coupon.per_user_limit ?? 1), valid_from: coupon.valid_from ? String(coupon.valid_from).slice(0, 16) : '', valid_until: coupon.valid_until ? String(coupon.valid_until).slice(0, 16) : '' });

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      if (!form.code.trim() && !editing) throw new Error('Coupon code is required.');
      const payload = toPayload(form);
      if (editing) await adminService.updateCoupon(editing.id, payload);
      else await adminService.createCoupon(payload);
      setEditing(null); setForm(emptyForm); await load();
    } catch (err) { setError(err?.message || 'Unable to save coupon.'); }
    finally { setSaving(false); }
  };

  const remove = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    setError('');
    try { await adminService.deleteCoupon(coupon.id); await load(); }
    catch (err) { setError(err?.message || 'Unable to delete coupon.'); }
  };

  return (
    <div className="admin-panel">
      <div className="admin-toolbar"><div><h2>Coupons</h2><p>Create and manage customer promo codes. Discount calculation remains backend-authoritative.</p></div><div className="btn-row"><button className="btn btn-quiet btn-sm" type="button" onClick={load} disabled={loading}><RiRefreshLine size={15} /> Refresh</button><button className="btn btn-sm" type="button" onClick={openCreate}><RiAddLine size={15} /> New coupon</button></div></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {(editing || (!editing && form.code !== '')) && <form className="admin-card" onSubmit={save}>
        <div className="field-grid"><div className="field"><label>Code *</label><input value={form.code} onChange={set('code')} maxLength={50} disabled={Boolean(editing)} /></div><div className="field"><label>Type</label><select value={form.type} onChange={set('type')}><option value="percent">Percent</option><option value="fixed">Fixed INR</option></select></div></div>
        <div className="field-grid"><div className="field"><label>Value *</label><input type="number" min="0.01" step="0.01" value={form.value} onChange={set('value')} /></div><div className="field"><label>Minimum order</label><input type="number" min="0" step="0.01" value={form.min_order_amount} onChange={set('min_order_amount')} /></div><div className="field"><label>Max discount</label><input type="number" min="0" step="0.01" value={form.max_discount} onChange={set('max_discount')} placeholder="No cap" /></div></div>
        <div className="field-grid"><div className="field"><label>Usage limit</label><input type="number" min="1" step="1" value={form.usage_limit} onChange={set('usage_limit')} placeholder="Unlimited" /></div><div className="field"><label>Per-user limit</label><input type="number" min="1" step="1" value={form.per_user_limit} onChange={set('per_user_limit')} /></div><div className="field"><label>Active</label><label className="checkbox-field"><input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> Enabled</label></div></div>
        <div className="field-grid"><div className="field"><label>Valid from</label><input type="datetime-local" value={form.valid_from} onChange={set('valid_from')} /></div><div className="field"><label>Valid until</label><input type="datetime-local" value={form.valid_until} onChange={set('valid_until')} /></div></div>
        <div className="field"><label>Description</label><textarea value={form.description} onChange={set('description')} rows={2} /></div>
        <div className="btn-row"><button className="btn" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update coupon' : 'Create coupon'}</button><button className="btn btn-quiet" type="button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button></div>
      </form>}
      <div className="admin-card" style={{ overflowX: 'auto' }}>
        {loading ? <div className="state">Loading coupons…</div> : coupons.length === 0 ? <div className="state">No coupons yet.</div> : <table className="admin-table"><thead><tr><th>Code</th><th>Discount</th><th>Minimum</th><th>Usage</th><th>Status</th><th>Validity</th><th /></tr></thead><tbody>{coupons.map((coupon) => <tr key={coupon.id}><td><strong>{coupon.code}</strong><div className="table-sub">{coupon.description || '—'}</div></td><td>{coupon.type === 'percent' ? `${coupon.value}%` : formatMoney(coupon.value)}{coupon.max_discount != null && <div className="table-sub">cap {formatMoney(coupon.max_discount)}</div>}</td><td>{formatMoney(coupon.min_order_amount)}</td><td>{coupon.used_count}{coupon.usage_limit != null ? ` / ${coupon.usage_limit}` : ' / ∞'}</td><td>{coupon.is_active ? 'Active' : 'Inactive'}</td><td><div className="table-sub">{coupon.valid_from ? new Date(coupon.valid_from).toLocaleString() : 'Now'}</div><div className="table-sub">{coupon.valid_until ? new Date(coupon.valid_until).toLocaleString() : 'No expiry'}</div></td><td><div className="btn-row"><button className="icon-btn" type="button" title="Edit" onClick={() => { setEditing(coupon); openEdit(coupon); }}><RiEditLine size={16} /></button><button className="icon-btn" type="button" title="Delete" onClick={() => remove(coupon)}><RiDeleteBinLine size={16} /></button></div></td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
