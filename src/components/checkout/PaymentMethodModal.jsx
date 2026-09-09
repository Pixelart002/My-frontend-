import { RiCloseLine, RiBankCardLine, RiCashLine, RiArrowRightLine } from '@remixicon/react';

export default function PaymentMethodModal({ open, value, onChange, onClose, onContinue, loading }) {
  if (!open) return null;

  return (
    <div className="payment-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
        <div className="payment-modal-header">
          <div>
            <p className="eyebrow">Checkout</p>
            <h3 id="payment-modal-title">Choose payment method</h3>
          </div>
          <button type="button" className="btn btn-quiet btn-icon" aria-label="Close payment method dialog" onClick={onClose} disabled={loading}>
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="payment-modal-options" role="radiogroup" aria-label="Payment method">
          <label className={`payment-option ${value === 'stripe' ? 'is-selected' : ''}`}>
            <input type="radio" name="payment-method" value="stripe" checked={value === 'stripe'} onChange={() => onChange('stripe')} />
            <span className="payment-option-icon"><RiBankCardLine size={20} /></span>
            <span className="payment-option-copy"><strong>Stripe</strong><small>Secure online payment by card and supported Stripe methods.</small></span>
          </label>
          <label className={`payment-option ${value === 'cod' ? 'is-selected' : ''}`}>
            <input type="radio" name="payment-method" value="cod" checked={value === 'cod'} onChange={() => onChange('cod')} />
            <span className="payment-option-icon"><RiCashLine size={20} /></span>
            <span className="payment-option-copy"><strong>Cash on Delivery</strong><small>Pay when your order arrives.</small></span>
          </label>
        </div>

        <div className="payment-modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="button" className="btn" onClick={onContinue} disabled={!value || loading}>
            {loading ? 'Preparing…' : 'Continue'} <RiArrowRightLine size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
