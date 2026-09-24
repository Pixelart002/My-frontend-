import { Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';

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

function BootScreen() {
  return (
    <div
      className="boot-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="boot-brand">
        LUVIIO
      </div>

      <div
        className="spin boot-spinner"
        aria-hidden="true"
      />

      <span className="sr-only">
        Loading Luviio…
      </span>
    </div>
  );
}

export default function StoreLayout() {
  const { initializing } = useAuth();
  const { pathname } = useLocation();
  
  if (initializing) {
    return <BootScreen />;
  }
  
  return (
    <div className="store-layout">
      <Header />

      <main
        className="store-main"
        data-route={pathname}
      >
        <div className="store-page-frame">
          <Outlet />
        </div>
      </main>

      {shouldShowFooter(pathname) && (
        <Footer />
      )}
    </div>
  );
}