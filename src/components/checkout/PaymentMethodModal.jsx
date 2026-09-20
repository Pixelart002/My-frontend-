import { useNavigate } from 'react-router-dom';
import { RiCloseLine, RiBankCardLine, RiCashLine, RiArrowRightLine, RiMapPinLine, RiShieldCheckLine, RiCheckboxCircleFill } from '@remixicon/react';
import { useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const iconStyle = { display: 'block', width: 20, height: 20, flex: '0 0 auto', color: 'currentColor' };

export default function PaymentMethodModal({ open, value, onChange, onClose, onContinue, loading, review = false, address, total, children, onBack, activeOrder = false, onCancelOrder, cancellingOrder = false }) {
  const navigate = useNavigate();
  if (!open) return null;
  const isCodSuccess = activeOrder && value === 'cod';
  const hasPaymentContent = Boolean(children) && !isCodSuccess;
  const locked = !isCodSuccess && (activeOrder || hasPaymentContent);
  const modalRef = useRef(null);
  const closeRef = useRef(null);
  const title = isCodSuccess ? 'Order placed successfully' : hasPaymentContent ? 'Complete payment' : review ? 'Review your order' : 'Choose payment method';
  const goToOrderSuccess = () => {
    const orderNumber = String(activeOrder?.orderNumber || '').trim();
    if (!orderNumber) { navigate('/orders', { replace: true }); return; }
    navigate('/order/success', { replace: true, state: { orderNumber, paymentMethod: 'cod' } });
  };
  const handleClose = () => {
    if (isCodSuccess) { goToOrderSuccess(); return; }
    if (locked) { onCancelOrder?.(); return; }
    onClose?.();
  };

  useFocusTrap({
    enabled: open,
    containerRef: modalRef,
    initialFocusRef: closeRef,
    onEscape: () => { if (!loading && !cancellingOrder) handleClose(); },
  });

  return <div className="payment-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading && (isCodSuccess || !locked)) handleClose(); }}>
    <div ref={modalRef} tabIndex={-1} className={`payment-modal ${review ? 'payment-modal-review' : ''} ${hasPaymentContent ? 'payment-modal-active' : ''}`} role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <header className="payment-modal-header">
        <div className="payment-modal-title-wrap"><p className="eyebrow">Secure checkout</p><h3 id="payment-modal-title">{title}</h3></div>
        <button ref={closeRef} type="button" className="btn btn-quiet btn-icon payment-modal-close" aria-label={isCodSuccess ? 'View order confirmation' : locked ? 'Cancel order' : 'Close payment dialog'} onClick={handleClose} disabled={loading || cancellingOrder}>
          <RiCloseLine aria-hidden="true" style={iconStyle} />
        </button>
      </header>
      <div className="payment-modal-body">
        {isCodSuccess ? <div className="payment-success-state"><RiCheckboxCircleFill size={54} className="order-result-icon" style={{ display: 'block', margin: '0 auto' }} /><strong>Your COD order is confirmed.</strong><p>Order <b>#{activeOrder.orderNumber}</b> has been placed successfully. You’ll pay when the order arrives.</p></div> : !review ? <div className="payment-modal-options" role="radiogroup" aria-label="Payment method">
          <label className={`payment-option ${value === 'stripe' ? 'is-selected' : ''}`}><input type="radio" name="payment-method" value="stripe" checked={value === 'stripe'} onChange={() => onChange('stripe')} /><span className="payment-option-icon"><RiBankCardLine aria-hidden="true" style={iconStyle} /></span><span className="payment-option-copy"><strong>Stripe</strong><small>Secure online payment by card and supported Stripe methods.</small></span></label>
          <label className={`payment-option ${value === 'cod' ? 'is-selected' : ''}`}><input type="radio" name="payment-method" value="cod" checked={value === 'cod'} onChange={() => onChange('cod')} /><span className="payment-option-icon"><RiCashLine aria-hidden="true" style={iconStyle} /></span><span className="payment-option-copy"><strong>Cash on Delivery</strong><small>Pay when your order arrives.</small></span></label>
        </div> : hasPaymentContent ? <div className="payment-modal-payment">{children}</div> : <div className="payment-review">
          <div className="payment-review-card"><div className="payment-review-heading"><RiMapPinLine aria-hidden="true" style={iconStyle} /><strong>Deliver to</strong></div>{address && <div className="payment-review-address"><strong>{address.full_name || 'Delivery address'}</strong><p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p><p>{address.city}{address.state ? `, ${address.state}` : ''} — {address.postal_code}, {address.country}</p>{address.email && <p>{address.email}</p>}{address.phone && <p>{address.phone}</p>}</div>}</div>
          <div className="payment-review-card payment-review-total"><span>Payment method</span><strong>{value === 'cod' ? 'Cash on Delivery' : 'Stripe'}</strong><span>Total</span><strong>{total}</strong></div>
          <div className="payment-review-secure"><RiShieldCheckLine aria-hidden="true" style={{ ...iconStyle, width: 17, height: 17 }} /> Your address and order total are reviewed before payment.</div>
        </div>}
      </div>
      {!isCodSuccess && !review && !locked && <footer className="payment-modal-actions"><button type="button" className="btn btn-quiet" onClick={onClose} disabled={loading}>Cancel</button><button type="button" className="btn payment-modal-primary" onClick={onContinue} disabled={!value || loading}>Continue <RiArrowRightLine aria-hidden="true" style={{ ...iconStyle, width: 17, height: 17 }} /></button></footer>}
      {!isCodSuccess && review && !hasPaymentContent && !activeOrder && <footer className="payment-modal-actions"><button type="button" className="btn btn-quiet" onClick={onBack} disabled={loading}>Back</button><button type="button" className="btn payment-modal-primary" onClick={onContinue} disabled={loading}>{loading ? 'Preparing…' : value === 'cod' ? 'Place COD Order' : 'Continue to Payment'} <RiArrowRightLine aria-hidden="true" style={{ ...iconStyle, width: 17, height: 17 }} /></button></footer>}
      {isCodSuccess && <footer className="payment-modal-actions"><button type="button" className="btn payment-modal-primary" onClick={goToOrderSuccess} disabled={loading}><span>View order confirmation</span><RiArrowRightLine aria-hidden="true" style={{ ...iconStyle, width: 17, height: 17 }} /></button></footer>}
    </div>
  </div>;
}
