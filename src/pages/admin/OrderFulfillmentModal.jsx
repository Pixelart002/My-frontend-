import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RiCheckLine,
  RiMapPin2Line,
  RiRefreshLine,
  RiTruckLine,
} from '@remixicon/react';

import AdminModal from './Modal';
import { adminService } from '../../services/admin';
import { useToast } from '../../context/ToastContext';

const normalize = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const text = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : String(value);

const STATUS_META = {
  paid: {
    label: 'Ready for dispatch',
    tone: 'pill-muted',
    next: 'Start processing',
  },
  processing: {
    label: 'Processing',
    tone: 'pill-gold',
    next: 'Add tracking & ship',
  },
  shipped: {
    label: 'Shipped',
    tone: 'pill-gold',
    next: 'Mark delivered',
  },
  delivered: {
    label: 'Delivered',
    tone: 'pill-success',
    next: '',
  },
};

const address = (order) =>
  [
    order?.shipping_line1,
    order?.shipping_line2,
    order?.shipping_landmark,
    order?.shipping_city,
    order?.shipping_state,
    order?.shipping_postal_code,
    order?.shipping_country,
  ]
    .filter(Boolean)
    .join(', ') || '—';

export default function OrderFulfillmentModal({
  order,
  capabilities = {},
  onClose,
  onUpdated,
}) {
  const { toast } = useToast();
  const [shipment, setShipment] = useState(null);
  const [tracking, setTracking] = useState(
    typeof order?.tracking_number === 'string'
      ? order.tracking_number
      : '',
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const status = normalize(order?.status);
  const meta = STATUS_META[status] || {
    label: text(order?.status),
    tone: 'pill-muted',
    next: '',
  };

  const canOrderUpdate = capabilities.orderUpdate === true;
  const canShippingUpdate =
    capabilities.shippingWrite === true ||
    capabilities.fulfillmentWrite === true;
  const canManage = canOrderUpdate && canShippingUpdate;

  const loadShipment = useCallback(async () => {
    if (!order?.id) {
      setShipment(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await adminService.fulfillmentShipment(order.id);

      setShipment(
        result?.status === 'not_booked' ? null : result,
      );
    } catch (error) {
      setShipment(null);
      toast.error(
        error?.message ||
          'Unable to load the shipment record.',
      );
    } finally {
      setLoading(false);
    }
  }, [order?.id, toast]);

  useEffect(() => {
    loadShipment();
  }, [loadShipment]);

  const refresh = useCallback(async () => {
    await loadShipment();
  }, [loadShipment]);

  const createShipmentIfNeeded = useCallback(async () => {
    if (shipment?.id) {
      return shipment;
    }

    if (!order?.id) {
      throw new Error('This order has no internal identifier.');
    }

    const created = await adminService.createProviderShipment(
      order.id,
      {},
    );

    const next =
      created?.status === 'not_booked' ? null : created;

    setShipment(next);
    return next;
  }, [order?.id, shipment]);

  const updateOrder = useCallback(
    async (data, message) => {
      if (!order?.order_number || busy) return;

      setBusy(true);

      try {
        await adminService.updateOrder(
          order.order_number,
          data,
        );
        toast.success(message);
        await onUpdated?.();
      } catch (error) {
        toast.error(
          error?.message ||
            'Unable to update the order.',
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, onUpdated, order?.order_number, toast],
  );

  const startProcessing = useCallback(async () => {
    if (!canManage || busy) return;

    setBusy(true);

    try {
      await createShipmentIfNeeded();
      await adminService.updateOrder(
        order.order_number,
        { status: 'processing' },
      );
      toast.success('Order moved to processing.');
      await onUpdated?.();
      await loadShipment();
    } catch (error) {
      toast.error(
        error?.message ||
          'Unable to start fulfillment.',
      );
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    canManage,
    createShipmentIfNeeded,
    loadShipment,
    onUpdated,
    order?.order_number,
    toast,
  ]);

  const saveTracking = useCallback(
    async (event) => {
      event.preventDefault();

      const value = tracking.trim();

      if (!value) {
        toast.error('Enter a tracking number.');
        return;
      }

      if (!canManage || busy || !order?.order_number) {
        return;
      }

      setBusy(true);

      try {
        const payload = {
          tracking_number: value,
          status:
            status === 'processing'
              ? 'shipped'
              : undefined,
        };

        await adminService.updateOrder(
          order.order_number,
          payload,
        );

        toast.success(
          status === 'processing'
            ? 'Tracking saved and order marked shipped.'
            : 'Tracking number updated.',
        );

        await onUpdated?.();
      } catch (error) {
        toast.error(
          error?.message ||
            'Unable to save tracking.',
        );
      } finally {
        setBusy(false);
      }
    },
    [
      busy,
      canManage,
      onUpdated,
      order?.order_number,
      status,
      toast,
      tracking,
    ],
  );

  const markDelivered = useCallback(async () => {
    if (!canManage || busy) return;

    await updateOrder(
      { status: 'delivered' },
      'Order marked delivered.',
    );
  }, [busy, canManage, updateOrder]);

  const summary = useMemo(
    () => [
      ['Customer', text(order?.shipping_name)],
      ['Destination', address(order)],
      ['Tracking', text(order?.tracking_number)],
    ],
    [order],
  );

  const action =
    status === 'paid'
      ? startProcessing
      : status === 'shipped'
        ? markDelivered
        : undefined;

  return (
    <AdminModal
      title={'Fulfillment · ' + text(order?.order_number)}
      sub="Dispatch controls stay attached to the order. Luviio uses manual shipping; the order remains the source of truth."
      onClose={busy ? undefined : onClose}
      className="max-w-[720px]"
    >
      <div className="grid gap-4">
        <section
          className="rounded-2xl border border-line bg-surface-2 p-4 sm:p-5"
          aria-labelledby="fulfillment-status-title"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Fulfillment status
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h3
                  id="fulfillment-status-title"
                  className="text-lg font-bold text-text"
                >
                  {meta.label}
                </h3>
                <span
                  className={'admin-pill ' + meta.tone}
                >
                  Manual shipping
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-quiet btn-sm shrink-0"
              onClick={refresh}
              disabled={loading || busy}
              title="Refresh fulfillment"
            >
              <RiRefreshLine
                size={15}
                className={loading ? 'spin' : undefined}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {summary.map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-xl border border-line bg-surface px-3 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-text">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3 text-sm leading-5 text-muted">
            <RiMapPin2Line
              size={17}
              className="mt-0.5 shrink-0 text-gold"
              aria-hidden="true"
            />
            <span>{address(order)}</span>
          </div>
        </section>

        <section
          className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
          aria-labelledby="shipment-record-title"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Internal linkage
              </p>
              <h3
                id="shipment-record-title"
                className="mt-1 text-base font-bold text-text"
              >
                Shipment record
              </h3>
            </div>
            <span
              className={
                'admin-pill ' +
                (shipment ? 'pill-success' : 'pill-muted')
              }
            >
              {loading
                ? 'Checking…'
                : shipment
                  ? 'Created'
                  : 'Not created'}
            </span>
          </div>

          {shipment && (
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-surface-2 px-3 py-2.5">
                <dt className="text-xs text-muted">Mode</dt>
                <dd className="mt-0.5 font-semibold text-text">
                  {text(shipment.provider_key || 'manual')}
                </dd>
              </div>
              <div className="rounded-xl bg-surface-2 px-3 py-2.5">
                <dt className="text-xs text-muted">Record status</dt>
                <dd className="mt-0.5 font-semibold text-text">
                  {text(shipment.status)}
                </dd>
              </div>
            </dl>
          )}

          <p className="mt-3 text-xs leading-5 text-muted">
            This record is internal bookkeeping only. Courier/AWB, pickup,
            labels and provider webhooks are intentionally disabled.
          </p>
        </section>

        {status === 'processing' && (
          <form
            onSubmit={saveTracking}
            className="rounded-2xl border border-line bg-surface-2 p-4 sm:p-5"
          >
            <label
              htmlFor="order-fulfillment-tracking"
              className="block text-sm font-semibold text-text"
            >
              Tracking number
            </label>
            <p className="mt-1 text-xs leading-5 text-muted">
              Enter the reference supplied by your actual courier or local delivery service.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="order-fulfillment-tracking"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 text-sm text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                value={tracking}
                maxLength={120}
                onChange={(event) =>
                  setTracking(event.target.value)
                }
                placeholder="e.g. LOCAL-DELIVERY-123"
                disabled={busy || !canManage}
              />
              <button
                type="submit"
                className="btn shrink-0"
                disabled={busy || !canManage}
              >
                <RiTruckLine size={15} aria-hidden="true" />
                {busy ? 'Saving…' : 'Mark shipped'}
              </button>
            </div>
          </form>
        )}

        {status === 'shipped' && (
          <div className="rounded-2xl border border-line bg-surface-2 p-4 sm:p-5">
            <label
              htmlFor="order-fulfillment-tracking-shipped"
              className="block text-sm font-semibold text-text"
            >
              Tracking number
            </label>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="order-fulfillment-tracking-shipped"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 text-sm text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                value={tracking}
                maxLength={120}
                onChange={(event) =>
                  setTracking(event.target.value)
                }
                placeholder="Tracking reference"
                disabled={busy || !canManage}
              />
              <button
                type="button"
                className="btn btn-quiet shrink-0"
                onClick={() =>
                  updateOrder(
                    {
                      tracking_number:
                        tracking.trim() || null,
                    },
                    'Tracking number updated.',
                  )
                }
                disabled={busy || !canManage}
              >
                Update tracking
              </button>
            </div>
          </div>
        )}

        {action && (
          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-text">
                {meta.next}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {status === 'paid'
                  ? 'Creates the internal shipment record if needed, then advances the order.'
                  : 'Advances the order after dispatch is complete.'}
              </p>
            </div>

            <button
              type="button"
              className="btn shrink-0"
              onClick={action}
              disabled={busy || !canManage}
            >
              {status === 'paid' ? (
                <RiTruckLine size={15} aria-hidden="true" />
              ) : (
                <RiCheckLine size={15} aria-hidden="true" />
              )}
              {busy ? 'Updating…' : meta.next}
            </button>
          </div>
        )}

        {!canManage && (
          <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-xs leading-5 text-muted">
            You can view this fulfillment state, but your current admin role does not have the permissions required to change it.
          </div>
        )}

        {status === 'delivered' && (
          <div className="rounded-2xl border border-success/20 bg-success-dim px-4 py-3 text-sm font-semibold text-success">
            <RiCheckLine
              className="mr-2 inline-block"
              size={16}
              aria-hidden="true"
            />
            Delivery completed. No further fulfillment action is required.
          </div>
        )}
      </div>
    </AdminModal>
  );
}
