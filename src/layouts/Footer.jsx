import { Link } from 'react-router-dom';
import {
  RiArrowRightUpLine,
  RiMailLine,
  RiMapPin2Line,
  RiShieldCheckLine,
} from '@remixicon/react';

import { APP_NAME } from '../config/env';

const SHOP_LINKS = [
  { to: '/shop', label: 'All products' },
  { to: '/shop?in_stock=1', label: 'In stock' },
  { to: '/cart', label: 'Your bag' },
];

const ACCOUNT_LINKS = [
  { to: '/account', label: 'Profile' },
  { to: '/orders', label: 'Order history' },
  { to: '/account/addresses', label: 'Addresses' },
];

const COMPANY_LINKS = [
  { to: '/about', label: 'About us' },
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms & conditions' },
];

const HELP_LINKS = [
  { to: '/shipping', label: 'Shipping' },
  { to: '/returns', label: 'Returns & cancellation' },
  { to: '/refund', label: 'Refund policy' },
];

function FooterNav({ id, title, links }) {
  return (
    <nav
      className="footer-nav"
      aria-labelledby={id}
    >
      <h2 id={id} className="footer-heading">
        {title}
      </h2>

      <ul className="footer-links">
        {links.map((link) => (
          <li key={`${link.to}-${link.label}`}>
            <Link
              className="footer-link"
              to={link.to}
            >
              <span>{link.label}</span>
              <RiArrowRightUpLine
                className="footer-link-icon"
                size={15}
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  
  const brandName =
    typeof APP_NAME === 'string' &&
    APP_NAME.trim() ?
    APP_NAME.trim() :
    'LUVIIO';
  
  return (
    <footer className="footer">
      <div className="footer-shell">
        <div className="footer-main">
          <section
            className="footer-brand"
            aria-labelledby="footer-brand-title"
          >
            <Link
              to="/"
              className="footer-brand-link"
              aria-label={`${brandName} home`}
            >
              <span
                id="footer-brand-title"
                className="footer-brand-name"
              >
                {brandName}
              </span>
            </Link>

            <p className="footer-tagline">
              Practical essentials for everyday
              living — hardware, sanitary and
              drainage solutions from Luviio.
            </p>

            <div className="footer-trust">
              <span className="footer-trust-item">
                <RiShieldCheckLine
                  size={17}
                  aria-hidden="true"
                />
                <span>Secure shopping</span>
              </span>

              <span className="footer-trust-item">
                <RiMapPin2Line
                  size={17}
                  aria-hidden="true"
                />
                <span>Serving India</span>
              </span>
            </div>
          </section>

          <FooterNav
            id="footer-shop"
            title="Shop"
            links={SHOP_LINKS}
          />

          <FooterNav
            id="footer-account"
            title="Account"
            links={ACCOUNT_LINKS}
          />

          <FooterNav
            id="footer-company"
            title="Company"
            links={COMPANY_LINKS}
          />

          <section
            className="footer-help"
            aria-labelledby="footer-help-title"
          >
            <FooterNav
              id="footer-help-title"
              title="Help"
              links={HELP_LINKS}
            />

            <a
              className="footer-support"
              href="mailto:support@luviio.in"
            >
              <span className="footer-support-icon">
                <RiMailLine
                  size={16}
                  aria-hidden="true"
                />
              </span>

              <span className="footer-support-copy">
                <strong>Need help?</strong>
                <span>Contact support</span>
              </span>

              <RiArrowRightUpLine
                size={16}
                aria-hidden="true"
              />
            </a>
          </section>
        </div>

        <div className="footer-bottom">
          <p>
            © {year} {brandName}. All rights reserved.
          </p>

          <p className="footer-bottom-note">
            Made for the everyday.
          </p>
        </div>
      </div>
    </footer>
  );
}