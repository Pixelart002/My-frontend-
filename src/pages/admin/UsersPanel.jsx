import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiEditLine, RiSearchLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { ErrorState, Spinner } from '../../components/ui/States';
import AdminModal from './Modal';

const PAGE_SIZE = 100;

const ROLES = [
  'super_admin',
  'admin',
  'manager',
  'support',
  'customer',
];

function text(value) {
  return value === null || value === undefined || value === ''
    ? '—'
    : String(value);
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN');
}

export default function UsersPanel({ capabilities = {} }) {
  const canUpdate = capabilities.userUpdate === true;
  const { toast } = useToast();

  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState(null);
  const [role, setRole] = useState('customer');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setError('');

    try {
      const result = await adminService.listUsers({
        page: 1,
        page_size: PAGE_SIZE,
      });

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setItems(itemsOfList(result));
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setError(
        err?.message || 'Unable to load users.',
      );
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];

    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((user) => {
      const email = String(user?.email || '').toLowerCase();
      const name = String(user?.full_name || '').toLowerCase();

      return (
        email.includes(query) ||
        name.includes(query)
      );
    });
  }, [items, search]);

  const openEdit = (user) => {
    if (!canUpdate || !user?.id) {
      return;
    }

    setEditing(user);
    setRole(
      ROLES.includes(user.role)
        ? user.role
        : 'customer',
    );
    setIsActive(user.is_active !== false);
  };

  const closeEdit = () => {
    if (savingRef.current) {
      return;
    }

    setEditing(null);
    setRole('customer');
    setIsActive(true);
  };

  const save = async (event) => {
    event.preventDefault();

    if (!canUpdate || !editing?.id) {
      return;
    }

    if (savingRef.current) {
      return;
    }

    if (!ROLES.includes(role)) {
      toast.error('Select a valid user role.');
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      await adminService.updateUser(
        editing.id,
        {
          role,
          is_active: isActive,
        },
      );

      if (!mountedRef.current) {
        return;
      }

      toast.success('User updated.');
      closeEdit();
      await load();
    } catch (err) {
      if (mountedRef.current) {
        toast.error(
          err?.message || 'Unable to update user.',
        );
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={load}
      />
    );
  }

  if (items === null) {
    return <Spinner label="Loading users…" />;
  }

  return (
    <div className="users-admin">
      <div className="admin-head users-admin-head">
        <div>
          <h1>Users</h1>

          <p className="admin-sub">
            {filtered.length} of {items.length} shown.
          </p>
        </div>

        <label
          className="admin-search users-search"
          htmlFor="users-search"
        >
          <RiSearchLine
            size={16}
            aria-hidden="true"
          />

          <input
            id="users-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search users…"
            autoComplete="off"
          />
        </label>
      </div>

      <div className="admin-table-wrap users-table-wrap">
        {filtered.length === 0 ? (
          <div className="admin-empty">
            No users match.
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table users-table">
              <caption className="sr-only">
                User accounts
              </caption>

              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Joined</th>

                  {canUpdate && (
                    <th scope="col">
                      <span className="sr-only">
                        Actions
                      </span>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td className="td-strong users-email">
                      {text(user.email)}
                    </td>

                    <td className="td-dim">
                      {text(user.full_name)}
                    </td>

                    <td>
                      <span className="admin-pill pill-gold">
                        {text(user.role)}
                      </span>
                    </td>

                    <td>
                      {user.is_active === false ? (
                        <span className="admin-pill pill-danger">
                          Inactive
                        </span>
                      ) : (
                        <span className="admin-pill pill-success">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="td-dim">
                      {formatDate(user.created_at)}
                    </td>

                    {canUpdate && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-quiet btn-sm"
                          onClick={() =>
                            openEdit(user)
                          }
                          aria-label={`Edit ${user.email || 'user'}`}
                        >
                          <RiEditLine
                            size={14}
                            aria-hidden="true"
                          />
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!canUpdate && (
        <div
          className="admin-page-note"
          role="note"
        >
          Read-only access: changing roles or account
          status requires an authorised administrator.
        </div>
      )}

      {editing && (
        <AdminModal
          title={editing.email || 'User'}
          sub="Manage this user's role and access."
          onClose={closeEdit}
        >
          <form
            className="users-edit-form"
            onSubmit={save}
          >
            <div className="field">
              <label htmlFor="u-role">
                Role
              </label>

              <select
                id="u-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
                }
                disabled={saving}
              >
                {ROLES.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <label className="check-line users-active-toggle">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(event.target.checked)
                }
                disabled={saving}
              />

              <span>
                <strong>Account active</strong>
                <small>
                  Allow this account to remain active.
                </small>
              </span>
            </label>

            <button
              className="btn btn-block"
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : 'Save user'}
            </button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}