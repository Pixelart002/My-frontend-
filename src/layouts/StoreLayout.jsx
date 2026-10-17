import { Outlet, useLocation } from 'react-router-dom';

import Header from './Header';
import Footer from './Footer';
import CookieConsent from '../components/CookieConsent';

const FOOTER_PATHS = new Set([
  '/',
  '/shop',
  '/privacy',
  '/terms',
  '/shipping',
  '/refund',
  '/returns',
  '/about',
]);

function shouldShowFooter(pathname) {
  return (
    FOOTER_PATHS.has(pathname) ||
    pathname.startsWith('/product/')
  );
}

export default function StoreLayout() {
  const { pathname } = useLocation();
  return (
    <div className="store-layout">
      <Header />

      <div
        className="store-main"
        data-route={pathname}
      >
        <div className="store-page-frame">
          <Outlet />
        </div>
      </div>

      {shouldShowFooter(pathname) && (
        <Footer />
      )}
    </div>
  );
}