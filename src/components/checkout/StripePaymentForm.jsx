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
    if (!stripe || !elements) return;

    setProcessing(true);
    setMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/order/success` },
      redirect: 'if_required',
    });

    if (error) {
      // Client-side reported failure; backend logs it (best-effort).
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
      // Confirm the order with the backend, then redirect to success.
      try {
        const confirmation = await paymentService.confirm(paymentIntent.id);
        await refreshProfile();
        onSuccess({ ...(confirmation || {}), payment_intent_id: paymentIntent.id });
      } catch (err) {
        // The payment succeeded on Stripe's side; confirm may need a retry.
        setMessage('Payment was successful, but confirming your order hit a snag. Please retry.');
        setProcessing(false);
      }
      return;
    }

    setMessage('Payment requires further action. Please try again.');
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <PaymentElement id="payment-element" />

      {message && <div className="form-error">{message}</div>}

      <div className="btn-row pay-actions">
        <button className="btn btn-quiet" type="button" onClick={onBack} disabled={processing}>
          Back
        </button>
        <button className="btn" type="submit" disabled={!stripe || processing}>
          <RiLockLine size={15} /> {processing ? 'Processing…' : `Pay ${orderNumber ? `· order ${orderNumber}` : ''}`}
        </button>
      </div>
      <p className="hint secure-hint">
        Payments are encrypted and processed securely by Stripe. Order {orderNumber && `#${orderNumber}`} will be created on payment.
      </p>
    </form>
  );
}
