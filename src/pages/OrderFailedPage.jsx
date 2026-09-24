import { Link } from 'react-router-dom';
import { RiErrorWarningLine } from '@remixicon/react';

export default function OrderFailedPage() {
  return (
    <div className="page container">
      <section
        className="order-result"
        role="alert"
        aria-labelledby="order-failed-title"
      >
        <RiErrorWarningLine
          size={52}
          className="order-result-icon danger"
          aria-hidden="true"
        />

        <p className="eyebrow">
          Payment unsuccessful
        </p>

        <h1 id="order-failed-title">
          We couldn’t complete your payment.
        </h1>

        <p>
          The payment was not completed. You can try again
          from checkout, or return to your bag and review
          your items.
        </p>

        <div
          className="btn-row"
          aria-label="Payment recovery options"
        >
          <Link
            className="btn"
            to="/checkout"
          >
            Try paying again
          </Link>

          <Link
            className="btn btn-quiet"
            to="/cart"
          >
            Back to your bag
          </Link>
        </div>
      </section>
    </div>
  );
}