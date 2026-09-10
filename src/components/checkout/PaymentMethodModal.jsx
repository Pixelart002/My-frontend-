import { RiCloseLine, RiBankCardLine, RiCashLine, RiArrowRightLine, RiMapPinLine, RiShieldCheckLine } from '@remixicon/react';

export default function PaymentMethodModal({ open, value, onChange, onClose, onContinue, loading, review = false, address, total, children, onBack, activeOrder = false, onCancelOrder, cancellingOrder = false }) {
  if (!open) return null;
  const hasPaymentContent = Boolean(children);
  const locked = activeOrder || hasPaymentContent;
  const title = activeOrder && value === 'cod' ? 'COD order active' : hasPaymentContent ? 'Complete payment' : review ? 'Review your order' : 'Choose payment method';
  const handleClose = () => { if (locked) { onCancelOrder?.(); return; } onClose?.(); };

  return <div className="payment-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading && !locked) onClose?.(); }}>
    <div className={`payment-modal ${review ? 'payment-modal-review' : ''} ${hasPaymentContent ? 'payment-modal-active' : ''}`} role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <header className="payment-modal-header"><div className="payment-modal-title-wrap"><p className="eyebrow">Secure checkout</p><h3 id="payment-modal-title">{title}</h3></div><button type="button" className="btn btn-quiet btn-icon payment-modal-close" aria-label={locked ? 'Cancel order' : 'Close payment dialog'} onClick={handleClose} disabled={loading || cancellingOrder}><RiCloseLine size={20} /></button></header>
      <div className="payment-modal-body">
        {!review ? <div className="payment-modal-options" role="radiogroup" aria-label="Payment method">
          <label className={`payment-option ${value === 'stripe' ? 'is-selected' : ''}`}><input type="radio" name="payment-method" value="stripe" checked={value === 'stripe'} onChange={() => onChange('stripe')} /><span className="payment-option-icon"><RiBankCardLine size={20} /></span><span className="payment-option-copy"><strong>Stripe</strong><small>Secure online payment by card and supported Stripe methods.</small></span></label>
          <label className={`payment-option ${value === 'cod' ? 'is-selected' : ''}`}><input type="radio" name="payment-method" value="cod" checked={value === 'cod'} onChange={() => onChange('cod')} /><span className="payment-option-icon"><RiCashLine size={20} /></span><span className="payment-option-copy"><strong>Cash on Delivery</strong><small>Pay when your order arrives.</small></span></label>
        </div> : hasPaymentContent ? <div className="payment-modal-payment">{children}</div> : <div className="payment-review">
          <div className="payment-review-card"><div className="payment-review-heading"><RiMapPinLine size={18} /><strong>Deliver to</strong></div>{address && <div className="payment-review-address"><strong>{address.full_name || 'Delivery address'}</strong><p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p><p>{address.city}{address.state ? `, ${address.state}` : ''} — {address.postal_code}, {address.country}</p>{address.email && <p>{address.email}</p>}{address.phone && <p>{address.phone}</p>}</div>}</div>
          <div className="payment-review-card payment-review-total"><span>Payment method</span><strong>{value === 'cod' ? 'Cash on Delivery' : 'Stripe'}</strong><span>Total</span><strong>{total}</strong></div>
          <div className="payment-review-secure"><RiShieldCheckLine size={17} /> Your address and order total are reviewed before payment.</div>
        </div>}
      </div>
      {!review && !locked && <footer className="payment-modal-actions"><button type="button" className="btn btn-quiet" onClick={onClose} disabled={loading}>Cancel</button><button type="button" className="btn payment-modal-primary" onClick={onContinue} disabled={!value || loading}>Continue <RiArrowRightLine size={17} /></button></footer>}
      {review && !hasPaymentContent && !activeOrder && <footer className="payment-modal-actions"><button type="button" className="btn btn-quiet" onClick={onBack} disabled={loading}>Back</button><button type="button" className="btn payment-modal-primary" onClick={onContinue} disabled={loading}>{loading ? 'Preparing…' : value === 'cod' ? 'Place COD Order' : 'Continue to Payment'} <RiArrowRightLine size={17} /></button></footer>}
      {activeOrder && value === 'cod' && <footer className="payment-modal-actions"><button type="button" className="btn btn-quiet" onClick={handleClose} disabled={loading || cancellingOrder}>Cancel order</button></footer>}
    </div>
  </div>;
}
