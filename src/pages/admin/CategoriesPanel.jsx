import { useCallback, useEffect, useState } from 'react';
import { RiAddLine, RiDeleteBinLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States';
import AdminModal from './Modal';

const blankCat = { name: '', slug: '', description: '' };

export default function CategoriesPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(blankCat);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(itemsOfList(await adminService.categories()));
    } catch (err) {
      setError(err.message || 'Unable to load categories.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm(blankCat);
    setEditing(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      description: form.description.trim() || undefined,
    };
    if (payload.name.length < 2) return toast.error('Name must be at least 2 characters.');
    if (!/^[a-z0-9-]+$/.test(payload.slug)) return toast.error('Slug can only contain lowercase letters, numbers and dashes.');
    setSaving(true);
    try {
      await adminService.createCategory(payload);
      toast.success('Category created.');
      setEditing(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to create category.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    setBusyId(c.id);
    try {
      await adminService.deleteCategory(c.id);
      toast.success('Category deleted.');
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to delete category.');
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (items === null) return <Spinner label="Loading categories…" />;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Categories</h1>
          <p className="admin-sub">Organise the catalogue by category.</p>
        </div>
        <button className="btn btn-sm" onClick={openAdd}><RiAddLine size={16} /> Add category</button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No categories yet" message="Add your first category to structure the catalogue." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id || c.slug}>
                  <td className="td-strong">{c.name}</td>
                  <td className="td-dim">{c.slug}</td>
                  <td className="td-dim">{c.description || '—'}</td>
                  <td>
                    <button
                      className="btn btn-quiet btn-sm"
                      onClick={() => remove(c)}
                      disabled={busyId === c.id}
                      aria-label={`Delete ${c.name}`}
                    >
                      <RiDeleteBinLine size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <AdminModal title="Add category" sub="A short, URL-safe slug will be used in shop links." onClose={() => setEditing(false)}>
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="cat-name">Name</label>
              <input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bath & body" />
            </div>
            <div className="field">
              <label htmlFor="cat-slug">Slug</label>
              <input id="cat-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. bath-body" />
            </div>
            <div className="field">
              <label htmlFor="cat-desc">Description</label>
              <textarea id="cat-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn btn-block" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create category'}</button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
