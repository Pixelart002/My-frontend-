import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiBankCardLine,
  RiCashLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiLoader4Line,
  RiMapPinLine,
  RiShieldCheckLine,
} from '@remixicon/react';

import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function PaymentMethodModal({
  open,
  value,
  onChange,
  onClose,
  onContinue,
  loading,
  review = false,
  address,
  total,
  children,
  onBack,
  activeOrder = false,
  onCancelOrder,
  cancellingOrder = false,
}) {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const closeRef = useRef(null);

  const isCodSuccess = Boolean(activeOrder) && value === 'cod';
  const hasPaymentContent = Boolean(children) && !isCodSuccess;
  const locked = !isCodSuccess && (Boolean(activeOrder) || hasPaymentContent);

  const title = isCodSuccess
    ? 'Order placed successfully'
    : hasPaymentContent
      ? 'Complete payment'
      : review
        ? 'Review your order'
        : 'Choose payment method';

  const goToOrderSuccess = () => {
    const orderNumber = String(activeOrder?.orderNumber || '').trim();

    if (!orderNumber) {
      navigate('/orders', { replace: true });
      return;
    }

    navigate('/order/success', {
      replace: true,
      state: {
        orderNumber,
        paymentMethod: 'cod',
      },
    });
  };

  const handleClose = () => {
    if (isCodSuccess) {
      goToOrderSuccess();
      return;
    }

    if (locked) {
      onCancelOrder?.();
      return;
    }

    onClose?.();
  };

  useFocusTrap({
    enabled: open,
    containerRef: modalRef,
    initialFocusRef: closeRef,
    onEscape: () => {
      if (!loading && !cancellingOrder) {
        handleClose();
      }
    },
  });

  if (!open) return null;

  const closeDisabled = loading || cancellingOrder;

  return (
    <div
      className="payment-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !closeDisabled &&
          (isCodSuccess || !locked)
        ) {
          handleClose();
        }
      }}
    >
      <section
        ref={modalRef}
        className={`payment-modal${review ? ' payment-modal-review' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        tabIndex={-1}
      >
        <header className="payment-modal-header">
          <div className="payment-modal-title-wrap">
            <p className="eyebrow">Secure checkout</p>
            <h3 id="payment-modal-title">{title}</h3>
            {!isCodSuccess && !hasPaymentContent && !review && (
              <p className="payment-modal-subtitle">
                Select how you want to pay for this order.
              </p>
            )}
          </div>

          <button
            ref={closeRef}
            type="button"
            className="btn btn-quiet payment-modal-close"
            aria-label={
              isCodSuccess
                ? 'View order confirmation'
                : locked
                  ? 'Cancel order'
                  : 'Close payment dialog'
            }
            disabled={closeDisabled}
            onClick={handleClose}
          >
            <RiCloseLine size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="payment-modal-body">
          {isCodSuccess ? (
            <div className="payment-success-state">
              <span className="payment-success-icon" aria-hidden="true">
                <RiCheckboxCircleFill size={44} />
              </span>
              <p className="eyebrow">Order confirmed</p>
              <strong>Cash on Delivery order placed</strong>
              <p>
                Order <b>#{activeOrder.orderNumber}</b> has been placed successfully.
                You’ll pay when the order arrives.
              </p>
            </div>
          ) : hasPaymentContent ? (
            <div className="payment-modal-payment">{children}</div>
          ) : !review ? (
            <div className="payment-modal-options" role="radiogroup" aria-label="Payment method">
              <label className={`payment-option${value === 'stripe' ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value="stripe"
                  checked={value === 'stripe'}
                  onChange={() => onChange('stripe')}
                />
                <span className="payment-option-icon" aria-hidden="true">
                  <RiBankCardLine size={21} />
                </span>
                <span className="payment-option-copy">
                  <strong>Online payment</strong>
                  <small>Pay securely with card, UPI and other Stripe-supported methods.</small>
                </span>
                <span aria-hidden="true">
                  {value === 'stripe' && <RiCheckboxCircleFill size={18} />}
                </span>
              </label>

              <label className={`payment-option${value === 'cod' ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value="cod"
                  checked={value === 'cod'}
                  onChange={() => onChange('cod')}
                />
                <span className="payment-option-icon" aria-hidden="true">
                  <RiCashLine size={21} />
                </span>
                <span className="payment-option-copy">
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives.</small>
                </span>
                <span aria-hidden="true">
                  {value === 'cod' && <RiCheckboxCircleFill size={18} />}
                </span>
              </label>
            </div>
          ) : (
            <div className="payment-review">
              <div className="payment-review-card">
                <div className="payment-review-heading">
                  <RiMapPinLine size={18} aria-hidden="true" />
                  <strong>Deliver to</strong>
                </div>

                {address && (
                  <div className="payment-review-address">
                    <strong>{address.full_name || 'Delivery address'}</strong>
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>
                      {address.city}
                      {address.state ? `, ${address.state}` : ''} — {address.postal_code},{' '}
                      {address.country}
                    </p>
                    {address.email && <p>{address.email}</p>}
                    {address.phone && <p>{address.phone}</p>}
                  </div>
                )}
              </div>

              <div className="payment-review-total">
                <span>Payment method</span>
                <strong>{value === 'cod' ? 'Cash on Delivery' : 'Online payment'}</strong>
                <span>Total</span>
                <strong>{total}</strong>
              </div>

              <div className="payment-review-secure">
                <RiShieldCheckLine size={17} aria-hidden="true" />
                <span>Your address and order total are reviewed before payment.</span>
              </div>
            </div>
          )}
        </div>

        {isCodSuccess && (
          <footer className="payment-modal-actions">
            <button
              type="button"
              className="btn payment-modal-primary"
              onClick={goToOrderSuccess}
              disabled={loading}
            >
              View order confirmation
              <RiArrowRightLine size={17} aria-hidden="true" />
            </button>
          </footer>
        )}

        {!isCodSuccess && !review && !locked && (
          <footer className="payment-modal-actions">
            <button
              type="button"
              className="btn btn-quiet"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn payment-modal-primary"
              onClick={onContinue}
              disabled={!value || loading}
            >
              {loading ? (
                <>
                  <RiLoader4Line className="spin" size={17} aria-hidden="true" />
                  Preparing…
                </>
              ) : (
                <>
                  Continue
                  <RiArrowRightLine size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </footer>
        )}

        {!isCodSuccess && review && !hasPaymentContent && !activeOrder && (
          <footer className="payment-modal-actions">
            <button
              type="button"
              className="btn btn-quiet"
              onClick={onBack}
              disabled={loading}
            >
              Back
            </button>
            <button
              type="button"
              className="btn payment-modal-primary"
              onClick={onContinue}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RiLoader4Line className="spin" size={17} aria-hidden="true" />
                  Preparing…
                </>
              ) : value === 'cod' ? (
                <>
                  Place COD Order
                  <RiArrowRightLine size={17} aria-hidden="true" />
                </>
              ) : (
                <>
                  Continue to Payment
                  <RiArrowRightLine size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}
