import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/env';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const year = new Date().getFullYear();
  const { isAuthenticated } = useAuth();

  const accountLinks = isAuthenticated
    ? [
        { to: '/account', label: 'Profile' },
        { to: '/orders', label: 'Order history' },
        { to: '/account/addresses', label: 'Addresses' },
      ]
    : [
        { to: '/login', label: 'Sign in' },
        { to: '/register', label: 'Create account' },
      ];

  const footerColumns = [
    {
      title: 'Shop',
      links: [
        { to: '/shop', label: 'All products' },
        { to: '/shop?in_stock=1', label: 'In stock' },
        { to: '/cart', label: 'Your bag' },
      ],
    },
    {
      title: 'Account',
      links: accountLinks,
    },
    {
      title: 'Company',
      links: [
        { to: '/about', label: 'About us' },
        { to: '/privacy', label: 'Privacy policy' },
        { to: '/terms', label: 'Terms & conditions' },
      ],
    },
    {
      title: 'Help',
      links: [
        { to: '/shipping', label: 'Shipping' },
        { to: '/returns', label: 'Returns & cancellation' },
        { to: '/refund', label: 'Refund policy' },
      ],
    },
  ];

  const supportLinks = [
    { to: '/about', label: 'Our story' },
    { to: '/shipping', label: 'Shipping guide' },
  ];

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-branding">
          <div className="brand">LUVIIO</div>
          <p className="footer-tagline">Curated essentials for a more considered everyday.</p>
          <div className="footer-meta">
            {supportLinks.map((link) => (
              <Link key={link.label} to={link.to}>{link.label}</Link>
            ))}
            <a href="mailto:support@luviio.in">support@luviio.in</a>
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title} className="footer-column">
            <h4>{column.title}</h4>
            <div className="footer-links">
              {column.links.map((link) => (
                <Link key={link.label} to={link.to}>{link.label}</Link>
              ))}
              {column.title === 'Help' && <a href="mailto:support@luviio.in">Contact support</a>}
            </div>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>© {year} {APP_NAME}</span>
        <span>Made for the everyday.</span>
      </div>
    </footer>
  );
}
