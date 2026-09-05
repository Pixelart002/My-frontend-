import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function OrderFailedPage() {
  return (
    <div className="page container">
      <div className="order-result">
        <AlertTriangle size={52} className="order-result-icon danger" />
        <p className="eyebrow">Payment unsuccessful</p>
        <h1>We couldn’t take payment.</h1>
        <p>Your card was not charged. You can try again, and your bag is still saved.</p>
        <div className="btn-row">
          <Link className="btn" to="/checkout">Try paying again</Link>
          <Link className="btn btn-quiet" to="/cart">Back to your bag</Link>
        </div>
      </div>
    </div>
  );
}
