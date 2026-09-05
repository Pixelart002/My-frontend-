import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { useCart } from '../context/CartContext';

export default function OrderSuccessPage() {
  const location = useLocation();
  const { reload } = useCart();
  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;

  useEffect(() => {
    // Re-sync the cart from the backend (the order flow consumes cart items).
    reload().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page container">
      <div className="order-result">
        <RiCheckboxCircleFill size={52} className="order-result-icon" />
        <p className="eyebrow">Payment confirmed</p>
        <h1>Thank you.</h1>
        <p>
          Your order{orderNumber ? ` #${orderNumber}` : ''} has been placed and is being prepared.
        </p>
        {orderId && (
          <div className="btn-row">
            <Link className="btn" to={`/orders/${orderId}`}>View order</Link>
            <Link className="btn btn-quiet" to="/orders">All orders</Link>
          </div>
        )}
        <Link className="btn btn-ghost" to="/shop">Continue shopping</Link>
      </div>
    </div>
  );
}
