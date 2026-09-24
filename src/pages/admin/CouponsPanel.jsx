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
  RiEditLine,
  RiRefreshLine,
} from '@remixicon/react';

import {
  adminService,
  itemsOfList,
} from '../../services/admin';

import { formatMoney } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = {
  code: '',
  type: 'percent',
  value: '',
  min_order_amount: '0',
  max_discount: '',
  valid_from: '',
  valid_until: '',
  usage_limit: '',
  per_user_limit: '1',
  is_active: true,
  description: '',
};

const CODE_PATTERN =
  /^[A-Z0-9]+(?:[-_][A-Z0-9]+)*$/i;

const cloneEmptyForm = () => ({
  ...EMPTY_FORM,
});

const normalizeCode = (value) =>
  String(value || '')
  .trim()
  .toUpperCase();

const toPayload = (
  form,
  editing,
) => {
  const payload = {
    type: form.type,
    value: Number(form.value),
    min_order_amount: Number(
      form.min_order_amount || 0,
    ),
    per_user_limit: Number(
      form.per_user_limit || 1,
    ),
    is_active: form.is_active === true,
    description: String(
      form.description || '',
    ).trim(),
  };
  
  if (!editing) {
    payload.code =
      normalizeCode(form.code);
  }
  
  if (
    form.max_discount !== ''
  ) {
    payload.max_discount =
      Number(form.max_discount);
  }
  
  if (form.valid_from) {
    payload.valid_from =
      new Date(
        form.valid_from,
      ).toISOString();
  }
  
  if (form.valid_until) {
    payload.valid_until =
      new Date(
        form.valid_until,
      ).toISOString();
  }
  
  if (
    form.usage_limit !== ''
  ) {
    payload.usage_limit =
      Number(form.usage_limit);
  }
  
  return payload;
};

const localDateTimeValue = (
  value,
) => {
  if (!value) return '';
  
  const date =
    new Date(value);
  
  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '';
  }
  
  const pad = (number) =>
    String(number).padStart(2, '0');
  
  return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
    ].join('-') +
    `T${pad(
      date.getHours(),
    )}:${pad(
      date.getMinutes(),
    )}`;
};

const formatDateTime = (
  value,
  fallback,
) => {
  if (!value) return fallback;
  
  const date =
    new Date(value);
  
  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return fallback;
  }
  
  return new Intl.DateTimeFormat(
    'en-IN',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
};

export default function CouponsPanel({
  autoOpenCreate = false,
  capabilities = {},
}) {
  const {
    toast,
  } = useToast();
  
  const canCreate =
    capabilities.couponCreate === true;
  
  const canUpdate =
    capabilities.couponUpdate === true;
  
  const canDelete =
    capabilities.couponDelete === true;
  
  const [
    coupons,
    setCoupons,
  ] = useState([]);
  
  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);
  
  const [
    loading,
    setLoading,
  ] = useState(true);
  
  const [
    saving,
    setSaving,
  ] = useState(false);
  
  const [
    deletingId,
    setDeletingId,
  ] = useState(null);
  
  const [
    error,
    setError,
  ] = useState('');
  
  const [
    editing,
    setEditing,
  ] = useState(null);
  
  const [
    formOpen,
    setFormOpen,
  ] = useState(
    autoOpenCreate &&
    canCreate,
  );
  
  const [
    form,
    setForm,
  ] = useState(
    cloneEmptyForm,
  );
  
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
      
      setLoading(true);
      setError('');
      
      try {
        const result =
          await adminService.listCoupons(
          {
            page: 1,
            page_size: 100,
          }, );
        
        const nextCoupons =
          itemsOfList(result);
        
        if (
          !mountedRef.current ||
          requestId !==
          requestIdRef.current
        ) {
          return;
        }
        
        setCoupons(
          Array.isArray(
            nextCoupons,
          ) ?
          nextCoupons :
          [],
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
          'Unable to load coupons.',
        );
      } finally {
        if (
          mountedRef.current &&
          requestId ===
          requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    }, []);
  
  useEffect(() => {
    load();
  }, [load]);
  
  const updateField =
    useCallback(
      (key) =>
      (event) => {
        const value =
          event.target.type ===
          'checkbox' ?
          event.target.checked :
          event.target.value;
        
        setForm(
          (current) => ({
            ...current,
            [key]: value,
          }),
        );
      },
      [],
    );
  
  const openCreate =
    useCallback(() => {
      if (
        !canCreate ||
        saving
      ) {
        return;
      }
      
      setEditing(null);
      setForm(
        cloneEmptyForm(),
      );
      setFormOpen(true);
    }, [canCreate, saving]);
  
  const openEdit =
    useCallback(
      (coupon) => {
        if (
          !canUpdate ||
          !coupon ||
          saving
        ) {
          return;
        }
        
        setEditing(coupon);
        
        setForm({
          ...cloneEmptyForm(),
          code: coupon.code || '',
          type: coupon.type ===
            'fixed' ?
            'fixed' :
            'percent',
          value: coupon.value == null ?
            '' :
            String(
              coupon.value,
            ),
          min_order_amount: String(
            coupon.min_order_amount ??
            0,
          ),
          max_discount: coupon.max_discount ==
            null ?
            '' :
            String(
              coupon.max_discount,
            ),
          usage_limit: coupon.usage_limit ==
            null ?
            '' :
            String(
              coupon.usage_limit,
            ),
          per_user_limit: String(
            coupon.per_user_limit ??
            1,
          ),
          valid_from: localDateTimeValue(
            coupon.valid_from,
          ),
          valid_until: localDateTimeValue(
            coupon.valid_until,
          ),
          is_active: coupon.is_active !==
            false,
          description: coupon.description ||
            '',
        });
        
        setFormOpen(true);
      },
      [canUpdate, saving],
    );
  
  const closeForm =
    useCallback(() => {
      if (saving) return;
      
      setEditing(null);
      
      setForm(
        cloneEmptyForm(),
      );
      
      setFormOpen(false);
    }, [saving]);
  
  const save =
    useCallback(
      async (event) => {
          event.preventDefault();
          
          if (
            saving ||
            (editing ?
              !canUpdate :
              !canCreate)
          ) {
            return;
          }
          
          setError('');
          
          const code =
            normalizeCode(
              form.code,
            );
          
          if (
            !editing &&
            !code
          ) {
            toast.error(
              'Coupon code is required.',
            );
            return;
          }
          
          if (
            !editing &&
            !CODE_PATTERN.test(
              code,
            )
          ) {
            toast.error(
              'Coupon code can contain letters, numbers, hyphens and underscores only.',
            );
            return;
          }
          
          const value =
            Number(form.value);
          
          if (
            !Number.isFinite(
              value,
            ) ||
            value <= 0
          ) {
            toast.error(
              'Coupon value must be greater than 0.',
            );
            return;
          }
          
          if (
            form.type ===
            'percent' &&
            value > 100
          ) {
            toast.error(
              'Percent coupon value cannot exceed 100%.',
            );
            return;
          }
          
          const minOrder =
            Number(
              form.min_order_amount ||
              0,
            );
          
          if (
            !Number.isFinite(
              minOrder,
            ) ||
            minOrder < 0
          ) {
            toast.error(
              'Minimum order cannot be negative.',
            );
            return;
          }
          
          const perUser =
            Number(
              form.per_user_limit ||
              1,
            );
          
          if (
            !Number.isInteger(
              perUser,
            ) ||
            perUser < 1
          ) {
            toast.error(
              'Per-user limit must be at least 1.',
            );
            return;
          }
          
          let usageLimit = null;
          
          if (
            form.usage_limit !==
            ''
          ) {
            usageLimit = Number(
              form.usage_limit,
            );
            
            if (
              !Number.isInteger(
                usageLimit,
              ) ||
              usageLimit < 1
            ) {
              toast.error(
                'Usage limit must be at least 1 when set.',
              );
              return;
            }
          }
          
          if (
            form.max_discount !==
            ''
          ) {
            const maxDiscount =
              Number(
                form.max_discount,
              );
            
            if (
              !Number.isFinite(
                maxDiscount,
              ) ||
              maxDiscount <= 0
            ) {
              toast.error(
                'Max discount must be greater than 0.',
              );
              return;
            }
            
            if (
              form.type ===
              'fixed' &&
              maxDiscount <
              value
            ) {
              toast.error(
                'For a fixed coupon, max discount cannot be lower than the coupon value.',
              );
              return;
            }
          }
          
          let validFrom = null;
          let validUntil = null;
          
          if (form.valid_from) {
            validFrom =
              new Date(
                form.valid_from,
              );
            
            if (
              Number.isNaN(
                validFrom.getTime(),
              )
            ) {
              toast.error(
                'Valid-from date is invalid.',
              );
              return;
            }
          }
          
          if (form.valid_until) {
            validUntil =
              new Date(
                form.valid_until,
              );
            
            if (
              Number.isNaN(
                validUntil.getTime(),
              )
            ) {
              toast.error(
                'Valid-until date is invalid.',
              );
              return;
            }
          }
          
          if (
            validFrom &&
            validUntil &&
            validUntil <=
            validFrom
          ) {
            toast.error(
              'Valid until must be later than valid from.',
            );
            return;
          }
          
          setSaving(true);
          
          try {
            const payload =
              toPayload(
                {
                  ...form,
                  code,
                  usage_limit: usageLimit == null ?
                    '' :
                    String(
                      usageLimit,
                    ),
                },
                Boolean(editing),
              );
            
            if (editing) {
              await adminService.updateCoupon(
                editing.id,
                payload,
              );
            } else {
              await adminService.createCoupon(
                payload,
              );
            }
            
            if (
              !mountedRef.current
            ) {
              return;
            }
            
            setEditing(null);
            
            setForm(
              cloneEmptyForm(),
            );
            
            setFormOpen(false);
            
            toast.success(
              editing ?
              'Coupon updated.' :
              'Coupon created.',
            );
            
            await load();
          } catch (err) {
            if (
              mountedRef.current
            ) {
              const message =
                err?.message ||
                'Unable to save coupon.';
              
              setError(message);
              toast.error(message);
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
          canUpdate,
          editing,
          form,
          load,
          saving,
          toast,
        ],
    );
  
  const askDelete =
    useCallback(
      (coupon) => {
        if (
          !canDelete ||
          !coupon ||
          deletingId
        ) {
          return;
        }
        
        setDeleteTarget(
          coupon,
        );
      },
      [canDelete, deletingId],
    );
  
  const confirmDelete =
    useCallback(async () => {
      const target =
        deleteTarget;
      
      if (
        !target?.id ||
        deletingId
      ) {
        return;
      }
      
      setDeletingId(
        target.id,
      );
      
      try {
        await adminService.deleteCoupon(
          target.id,
        );
        
        if (
          !mountedRef.current
        ) {
          return;
        }
        
        setDeleteTarget(null);
        
        toast.success(
          'Coupon deleted.',
        );
        
        await load();
      } catch (err) {
        if (
          mountedRef.current
        ) {
          toast.error(
            err?.message ||
            'Unable to delete coupon.',
          );
        }
      } finally {
        if (
          mountedRef.current
        ) {
          setDeletingId(null);
        }
      }
    }, [
      deleteTarget,
      deletingId,
      load,
      toast,
    ]);
  
  return (
    <>
      <section
        className="admin-panel coupons-panel"
        aria-labelledby="coupons-title"
      >
        <div className="admin-toolbar">
          <div>
            <h2 id="coupons-title">
              Coupons
            </h2>

            <p>
              Customer promo codes with
              server-side validation,
              per-user limits and atomic
              checkout reservation.
            </p>
          </div>

          <div className="btn-row">
            <button
              className="btn btn-quiet btn-sm"
              type="button"
              onClick={load}
              disabled={
                loading ||
                saving ||
                Boolean(deletingId)
              }
            >
              <RiRefreshLine
                size={15}
                aria-hidden="true"
              />
              Refresh
            </button>

            {canCreate && (
              <button
                className="btn btn-sm"
                type="button"
                onClick={openCreate}
                disabled={
                  saving ||
                  Boolean(deletingId)
                }
              >
                <RiAddLine
                  size={15}
                  aria-hidden="true"
                />
                New coupon
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            className="form-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {formOpen &&
          (canCreate ||
            canUpdate) && (
            <form
              className="admin-card coupon-form"
              onSubmit={save}
              noValidate
            >
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="coupon-code">
                    Code *
                  </label>

                  <input
                    id="coupon-code"
                    name="code"
                    value={form.code}
                    onChange={updateField(
                      'code',
                    )}
                    maxLength={50}
                    disabled={
                      Boolean(
                        editing,
                      ) || saving
                    }
                    placeholder="e.g. WELCOME10"
                    autoComplete="off"
                    spellCheck="false"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="coupon-type">
                    Type
                  </label>

                  <select
                    id="coupon-type"
                    value={form.type}
                    onChange={updateField(
                      'type',
                    )}
                    disabled={saving}
                  >
                    <option value="percent">
                      Percent
                    </option>

                    <option value="fixed">
                      Fixed INR
                    </option>
                  </select>
                </div>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label htmlFor="coupon-value">
                    Value *
                  </label>

                  <input
                    id="coupon-value"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={
                      form.type ===
                      'percent'
                        ? '100'
                        : undefined
                    }
                    value={form.value}
                    onChange={updateField(
                      'value',
                    )}
                    disabled={saving}
                    inputMode="decimal"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="coupon-min-order">
                    Minimum order
                  </label>

                  <input
                    id="coupon-min-order"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.min_order_amount
                    }
                    onChange={updateField(
                      'min_order_amount',
                    )}
                    disabled={saving}
                    inputMode="decimal"
                  />
                </div>

                <div className="field">
                  <label htmlFor="coupon-max-discount">
                    Max discount
                  </label>

                  <input
                    id="coupon-max-discount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      form.max_discount
                    }
                    onChange={updateField(
                      'max_discount',
                    )}
                    disabled={saving}
                    inputMode="decimal"
                    placeholder="No cap"
                  />
                </div>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label htmlFor="coupon-usage-limit">
                    Total usage limit
                  </label>

                  <input
                    id="coupon-usage-limit"
                    type="number"
                    min="1"
                    step="1"
                    value={
                      form.usage_limit
                    }
                    onChange={updateField(
                      'usage_limit',
                    )}
                    disabled={saving}
                    inputMode="numeric"
                    placeholder="Unlimited"
                  />
                </div>

                <div className="field">
                  <label htmlFor="coupon-per-user">
                    Per-user limit
                  </label>

                  <input
                    id="coupon-per-user"
                    type="number"
                    min="1"
                    step="1"
                    value={
                      form.per_user_limit
                    }
                    onChange={updateField(
                      'per_user_limit',
                    )}
                    disabled={saving}
                    inputMode="numeric"
                  />

                  <small>
                    How many times one
                    customer can redeem
                    this coupon.
                  </small>
                </div>

                <div className="field">
                  <span className="field-label">
                    Active
                  </span>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={
                        form.is_active
                      }
                      onChange={updateField(
                        'is_active',
                      )}
                      disabled={saving}
                    />
                    Enabled
                  </label>
                </div>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label htmlFor="coupon-valid-from">
                    Valid from
                  </label>

                  <input
                    id="coupon-valid-from"
                    type="datetime-local"
                    value={
                      form.valid_from
                    }
                    onChange={updateField(
                      'valid_from',
                    )}
                    disabled={saving}
                  />
                </div>

                <div className="field">
                  <label htmlFor="coupon-valid-until">
                    Valid until
                  </label>

                  <input
                    id="coupon-valid-until"
                    type="datetime-local"
                    value={
                      form.valid_until
                    }
                    onChange={updateField(
                      'valid_until',
                    )}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="coupon-description">
                  Description
                </label>

                <textarea
                  id="coupon-description"
                  value={
                    form.description
                  }
                  onChange={updateField(
                    'description',
                  )}
                  rows={3}
                  maxLength={500}
                  disabled={saving}
                  placeholder="Optional internal/customer-facing description"
                />
              </div>

              <div className="btn-row">
                <button
                  className="btn"
                  type="submit"
                  disabled={saving}
                  aria-busy={saving}
                >
                  {saving
                    ? 'Saving…'
                    : editing
                      ? 'Update coupon'
                      : 'Create coupon'}
                </button>

                <button
                  className="btn btn-quiet"
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

        {!canCreate &&
          !canUpdate &&
          !canDelete && (
            <div
              className="admin-page-note"
              role="note"
            >
              Read-only access: coupon
              management actions are
              restricted to authorised roles.
            </div>
          )}

        <div className="admin-card coupons-table-card">
          {loading ? (
            <div
              className="state"
              role="status"
              aria-live="polite"
            >
              Loading coupons…
            </div>
          ) : coupons.length ===
            0 ? (
            <div className="state">
              No coupons yet.
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table coupons-table">
                <caption className="sr-only">
                  Luviio customer coupons
                </caption>

                <thead>
                  <tr>
                    <th scope="col">
                      Code
                    </th>
                    <th scope="col">
                      Discount
                    </th>
                    <th scope="col">
                      Minimum
                    </th>
                    <th scope="col">
                      Total usage
                    </th>
                    <th scope="col">
                      Per user
                    </th>
                    <th scope="col">
                      Status
                    </th>
                    <th scope="col">
                      Validity
                    </th>

                    {(canUpdate ||
                      canDelete) && (
                      <th
                        scope="col"
                        aria-label="Actions"
                      />
                    )}
                  </tr>
                </thead>

                <tbody>
                  {coupons.map(
                    (coupon) => {
                      const deleting =
                        deletingId ===
                        coupon.id;

                      return (
                        <tr
                          key={
                            coupon.id ||
                            coupon.code
                          }
                        >
                          <td data-label="Code">
                            <strong>
                              {coupon.code ||
                                '—'}
                            </strong>

                            <div className="table-sub">
                              {coupon.description ||
                                '—'}
                            </div>
                          </td>

                          <td data-label="Discount">
                            {coupon.type ===
                            'percent'
                              ? `${coupon.value}%`
                              : formatMoney(
                                  coupon.value,
                                )}

                            {coupon.max_discount !=
                              null && (
                              <div className="table-sub">
                                cap{' '}
                                {formatMoney(
                                  coupon.max_discount,
                                )}
                              </div>
                            )}
                          </td>

                          <td data-label="Minimum">
                            {formatMoney(
                              coupon.min_order_amount,
                            )}
                          </td>

                          <td data-label="Total usage">
                            {coupon.used_count ??
                              0}

                            {coupon.usage_limit !=
                            null
                              ? ` / ${coupon.usage_limit}`
                              : ' / ∞'}
                          </td>

                          <td data-label="Per user">
                            {coupon.per_user_limit ??
                              1}
                            ×
                          </td>

                          <td data-label="Status">
                            <span
                              className={`admin-pill ${
                                coupon.is_active
                                  ? 'pill-success'
                                  : ''
                              }`}
                            >
                              {coupon.is_active
                                ? 'Active'
                                : 'Inactive'}
                            </span>
                          </td>

                          <td data-label="Validity">
                            <div className="table-sub">
                              {formatDateTime(
                                coupon.valid_from,
                                'Now',
                              )}
                            </div>

                            <div className="table-sub">
                              {formatDateTime(
                                coupon.valid_until,
                                'No expiry',
                              )}
                            </div>
                          </td>

                          {(canUpdate ||
                            canDelete) && (
                            <td
                              data-label="Actions"
                              className="coupon-actions"
                            >
                              <div className="btn-row">
                                {canUpdate && (
                                  <button
                                    className="icon-btn"
                                    type="button"
                                    title={`Edit ${coupon.code || 'coupon'}`}
                                    aria-label={`Edit ${coupon.code || 'coupon'}`}
                                    onClick={() =>
                                      openEdit(
                                        coupon,
                                      )
                                    }
                                    disabled={
                                      Boolean(
                                        deletingId,
                                      )
                                    }
                                  >
                                    <RiEditLine
                                      size={16}
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}

                                {canDelete && (
                                  <button
                                    className="icon-btn"
                                    type="button"
                                    title={`Delete ${coupon.code || 'coupon'}`}
                                    aria-label={`Delete ${coupon.code || 'coupon'}`}
                                    onClick={() =>
                                      askDelete(
                                        coupon,
                                      )
                                    }
                                    disabled={
                                      Boolean(
                                        deletingId,
                                      )
                                    }
                                  >
                                    <RiDeleteBinLine
                                      size={16}
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}

                                {deleting && (
                                  <span
                                    className="sr-only"
                                    role="status"
                                    aria-live="polite"
                                  >
                                    Deleting coupon…
                                  </span>
                                )}
                              </div>
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
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(
          deleteTarget,
        )}
        title="Delete coupon?"
        message={
          deleteTarget
            ? `Delete coupon ${deleteTarget.code}?`
            : ''
        }
        confirmLabel={
          deletingId
            ? 'Deleting…'
            : 'Delete coupon'
        }
        danger
        onCancel={() => {
          if (!deletingId) {
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