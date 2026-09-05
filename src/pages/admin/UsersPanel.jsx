import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiEditLine, RiSearchLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { ErrorState, Spinner } from '../../components/ui/States';
import AdminModal from './Modal';

const PAGE_SIZE = 100;
const ROLES = ['super_admin', 'admin', 'manager', 'support', 'customer'];

export default function UsersPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(itemsOfList(await adminService.listUsers({ page: 1, page_size: PAGE_SIZE })));
    } catch (err) {
      setError(err.message || 'Unable to load users.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.full_name || '').toLowerCase().includes(q),
    );
  }, [items, search]);

  const openEdit = (u) => {
    setEditing(u);
    setRole(u.role || 'customer');
    setIsActive(u.is_active !== false);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.updateUser(editing.id, { role, is_active: isActive });
      toast.success('User updated.');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to update user.');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (items === null) return <Spinner label="Loading users…" />;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Users</h1>
          <p className="admin-sub">{filtered.length} of {items.length} shown.</p>
        </div>
        <label className="admin-search" style={{ maxWidth: 260 }}>
          <RiSearchLine size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" />
        </label>
      </div>

      <div className="admin-table-wrap">
        {filtered.length === 0 ? (
          <div className="admin-empty">No users match.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="td-strong">{u.email}</td>
                  <td className="td-dim">{u.full_name || '—'}</td>
                  <td><span className="admin-pill pill-gold">{u.role}</span></td>
                  <td>{u.is_active === false ? <span className="admin-pill pill-danger">Inactive</span> : <span className="admin-pill pill-success">Active</span>}</td>
                  <td className="td-dim">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td><button className="btn btn-quiet btn-sm" onClick={() => openEdit(u)}><RiEditLine size={14} /> Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <AdminModal title={editing.email} sub="Manage this user's role and access." onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <div className="field">
              <label htmlFor="u-role">Role</label>
              <select id="u-role" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <label className="check-line" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Account active
            </label>
            <button className="btn btn-block" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save user'}</button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
