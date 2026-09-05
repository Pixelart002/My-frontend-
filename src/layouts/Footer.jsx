import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/env';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="brand">LUVIIO</div>
          <p className="footer-tagline">Curated essentials for a more considered everyday.</p>
        </div>

        <div>
          <h4>Shop</h4>
          <Link to="/shop">All products</Link>
          <Link to="/shop?in_stock=1">In stock</Link>
          <Link to="/cart">Your bag</Link>
        </div>

        <div>
          <h4>Account</h4>
          <Link to="/account">Profile</Link>
          <Link to="/orders">Order history</Link>
          <Link to="/account/addresses">Addresses</Link>
        </div>

        <div>
          <h4>Help</h4>
          <a href="mailto:support@luviio.in">Contact support</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} {APP_NAME}</span>
        <span>Made for the everyday.</span>
      </div>
    </footer>
  );
}
