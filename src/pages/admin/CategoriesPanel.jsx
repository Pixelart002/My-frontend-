import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import ConfirmDialog from '../../components/ui/ConfirmDialog';

import {
  RiAddLine,
  RiDeleteBinLine,
} from '@remixicon/react';

import {
  adminService,
  itemsOfList,
} from '../../services/admin';

import { useToast } from '../../context/ToastContext';

import {
  EmptyState,
  ErrorState,
  Spinner,
} from '../../components/ui/States';

import AdminModal from './Modal';

const BLANK_CATEGORY = {
  name: '',
  slug: '',
  description: '',
};

const SLUG_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const updateField =
  (setForm, key) =>
  (event) => {
    const value =
      event.target.value;

    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

const normalizeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

export default function CategoriesPanel({
  capabilities = {},
}) {
  const canCreate =
    capabilities.categoryCreate === true;

  const canDelete =
    capabilities.categoryDelete === true;

  const { toast } =
    useToast();

  const [
    items,
    setItems,
  ] = useState(null);

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({
    ...BLANK_CATEGORY,
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    busyId,
    setBusyId,
  ] = useState(null);

  const mountedRef =
    useRef(true);

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current =
        false;

      requestIdRef.current += 1;
    };
  }, []);

  const load =
    useCallback(async () => {
      const requestId =
        ++requestIdRef.current;

      setError('');

      try {
        const response =
          await adminService.categories();

        const nextItems =
          itemsOfList(response);

        if (
          !mountedRef.current ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        setItems(
          Array.isArray(nextItems)
            ? nextItems
            : [],
        );
      } catch (err) {
        if (
          !mountedRef.current ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        setError(
          err?.message ||
            'Unable to load categories.',
        );
      }
    }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd =
    useCallback(() => {
      if (
        !canCreate ||
        saving
      ) {
        return;
      }

      setForm({
        ...BLANK_CATEGORY,
      });

      setEditing(true);
    }, [canCreate, saving]);

  const closeAdd =
    useCallback(() => {
      if (saving) return;

      setEditing(false);

      setForm({
        ...BLANK_CATEGORY,
      });
    }, [saving]);

  const submit =
    useCallback(
      async (event) => {
        event.preventDefault();

        if (
          !canCreate ||
          saving
        ) {
          return;
        }

        const name =
          String(
            form.name || '',
          ).trim();

        const slug =
          normalizeSlug(
            form.slug,
          );

        const description =
          String(
            form.description || '',
          ).trim();

        if (name.length < 2) {
          toast.error(
            'Name must be at least 2 characters.',
          );
          return;
        }

        if (slug.length < 2) {
          toast.error(
            'Slug must be at least 2 characters.',
          );
          return;
        }

        if (
          !SLUG_PATTERN.test(slug)
        ) {
          toast.error(
            'Slug can only contain lowercase letters, numbers and single dashes.',
          );
          return;
        }

        setSaving(true);

        try {
          await adminService.createCategory(
            {
              name,
              slug,
              ...(description
                ? {
                    description,
                  }
                : {}),
            },
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          setEditing(false);

          setForm({
            ...BLANK_CATEGORY,
          });

          toast.success(
            'Category created.',
          );

          await load();
        } catch (err) {
          if (
            mountedRef.current
          ) {
            toast.error(
              err?.message ||
                'Unable to create category.',
            );
          }
        } finally {
          if (
            mountedRef.current
          ) {
            setSaving(false);
          }
        }
      },
      [
        canCreate,
        form,
        load,
        saving,
        toast,
      ],
    );

  const remove =
    useCallback(
      async (category) => {
        if (
          !canDelete ||
          !category?.id ||
          busyId
        ) {
          return;
        }

        setBusyId(category.id);

        try {
          await adminService.deleteCategory(
            category.id,
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          toast.success(
            'Category deleted.',
          );

          await load();
        } catch (err) {
          if (
            mountedRef.current
          ) {
            toast.error(
              err?.message ||
                'Unable to delete category.',
            );
          }

          throw err;
        } finally {
          if (
            mountedRef.current
          ) {
            setBusyId(null);
          }
        }
      },
      [
        busyId,
        canDelete,
        load,
        toast,
      ],
    );

  const confirmDelete =
    useCallback(async () => {
      if (!deleteTarget) {
        return;
      }

      try {
        await remove(
          deleteTarget,
        );
      } finally {
        if (
          mountedRef.current
        ) {
          setDeleteTarget(
            null,
          );
        }
      }
    }, [
      deleteTarget,
      remove,
    ]);

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={load}
      />
    );
  }

  if (items === null) {
    return (
      <Spinner
        label="Loading categories…"
      />
    );
  }

  return (
    <>
      <section
        className="admin-panel"
        aria-labelledby="categories-title"
      >
        <div className="admin-head">
          <div>
            <h1 id="categories-title">
              Categories
            </h1>

            <p className="admin-sub">
              Organise the catalogue by
              category.
            </p>
          </div>

          {canCreate && (
            <button
              className="btn btn-sm"
              type="button"
              onClick={openAdd}
              disabled={saving}
            >
              <RiAddLine
                size={16}
                aria-hidden="true"
              />
              Add category
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No categories yet"
            message="Add your first category to structure the catalogue."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <caption className="sr-only">
                Luviio product categories
              </caption>

              <thead>
                <tr>
                  <th scope="col">
                    Name
                  </th>

                  <th scope="col">
                    Slug
                  </th>

                  <th scope="col">
                    Description
                  </th>

                  {canDelete && (
                    <th
                      scope="col"
                      aria-label="Actions"
                    />
                  )}
                </tr>
              </thead>

              <tbody>
                {items.map(
                  (category) => {
                    const id =
                      category?.id;

                    const key =
                      id ||
                      category?.slug ||
                      category?.name;

                    const deleting =
                      busyId === id;

                    return (
                      <tr key={key}>
                        <td
                          data-label="Name"
                          className="td-strong"
                        >
                          {category?.name ||
                            '—'}
                        </td>

                        <td
                          data-label="Slug"
                          className="td-dim"
                        >
                          <code className="category-slug">
                            {category?.slug ||
                              '—'}
                          </code>
                        </td>

                        <td
                          data-label="Description"
                          className="td-dim category-description"
                        >
                          {category?.description ||
                            '—'}
                        </td>

                        {canDelete && (
                          <td
                            data-label="Actions"
                            className="category-actions"
                          >
                            <button
                              className="btn btn-quiet btn-sm"
                              type="button"
                              onClick={() =>
                                setDeleteTarget(
                                  category,
                                )
                              }
                              disabled={
                                Boolean(
                                  busyId,
                                )
                              }
                              aria-label={`Delete ${category?.name || 'category'}`}
                            >
                              <RiDeleteBinLine
                                size={14}
                                aria-hidden="true"
                              />

                              {deleting
                                ? 'Deleting…'
                                : 'Delete'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <AdminModal
          title="Add category"
          sub="Use a short, URL-safe slug for shop links."
          onClose={closeAdd}
        >
          <form
            onSubmit={submit}
            noValidate
          >
            <div className="field">
              <label htmlFor="cat-name">
                Name
              </label>

              <input
                id="cat-name"
                name="name"
                value={form.name}
                onChange={updateField(
                  setForm,
                  'name',
                )}
                placeholder="e.g. Bath & body"
                autoComplete="off"
                maxLength={120}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="cat-slug">
                Slug
              </label>

              <input
                id="cat-slug"
                name="slug"
                value={form.slug}
                onChange={updateField(
                  setForm,
                  'slug',
                )}
                onBlur={() =>
                  setForm(
                    (current) => ({
                      ...current,
                      slug:
                        normalizeSlug(
                          current.slug,
                        ),
                    }),
                  )
                }
                placeholder="e.g. bath-body"
                autoComplete="off"
                inputMode="url"
                maxLength={120}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
                aria-describedby="cat-slug-help"
              />

              <small
                id="cat-slug-help"
                className="field-help"
              >
                Lowercase letters, numbers
                and single dashes only.
              </small>
            </div>

            <div className="field">
              <label htmlFor="cat-desc">
                Description
              </label>

              <textarea
                id="cat-desc"
                name="description"
                value={form.description}
                onChange={updateField(
                  setForm,
                  'description',
                )}
                placeholder="Optional category description"
                rows={4}
                maxLength={500}
              />
            </div>

            <button
              className="btn btn-block"
              type="submit"
              disabled={saving}
              aria-busy={saving}
            >
              {saving
                ? 'Saving…'
                : 'Create category'}
            </button>
          </form>
        </AdminModal>
      )}

      <ConfirmDialog
        open={Boolean(
          deleteTarget,
        )}
        title="Delete category?"
        message={
          deleteTarget
            ? `Delete “${deleteTarget.name}”? This cannot be undone.`
            : ''
        }
        confirmLabel={
          busyId
            ? 'Deleting…'
            : 'Delete category'
        }
        danger
        onCancel={() => {
          if (!busyId) {
            setDeleteTarget(
              null,
            );
          }
        }}
        onConfirm={
          confirmDelete
        }
      />
    </>
  );
}