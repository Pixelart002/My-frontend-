import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { paymentService } from '../../services/payments';
import { useAuth } from '../../context/AuthContext';
import { RiLockLine } from '@remixicon/react';

export default function StripePaymentForm({ orderNumber, onSuccess, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const { refreshProfile } = useAuth();

  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    setMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/order/success` },
      redirect: 'if_required',
    });

    if (error) {
      const intentId = paymentIntent?.id || paymentIntentId;
      if (intentId) {
        paymentService.notifyFailed(intentId, error.message || '').catch(() => {});
      }
      setPaymentIntentId(intentId);
      setMessage(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        const confirmation = await paymentService.confirm(paymentIntent.id);
        await refreshProfile();
        onSuccess({ ...(confirmation || {}), payment_intent_id: paymentIntent.id });
      } catch (err) {
        setMessage('Payment was successful, but confirming your order hit a snag. Please retry.');
        setProcessing(false);
      }
      return;
    }

    setMessage('Payment requires further action. Please try again.');
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form payment-stripe-form">
      <div className="payment-element-shell">
        <PaymentElement id="payment-element" />
      </div>

      {message && <div className="form-error payment-form-error" role="alert">{message}</div>}

      <div className="payment-form-actions">
        <button className="btn btn-quiet payment-back-btn" type="button" onClick={onBack} disabled={processing}>
          Back
        </button>
        <button className="btn payment-submit-btn" type="submit" disabled={!stripe || !elements || processing}>
          <RiLockLine size={15} aria-hidden="true" />
          <span>{processing ? 'Processing…' : 'Pay securely'}</span>
        </button>
      </div>
      <p className="hint secure-hint">
        Payments are encrypted and processed securely by Stripe. Order {orderNumber ? `#${orderNumber}` : ''} will be confirmed after successful payment.
      </p>
    </form>
  );
}
