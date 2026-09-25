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
      className="boot-screen fixed inset-0 z-[100] grid min-w-[320px] place-items-center overflow-hidden bg-[#080808] text-text [background-image:radial-gradient(circle_at_50%_42%,rgba(216,173,106,.075),transparent_30%)] motion-reduce:transition-none"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="boot-brand relative z-[1] font-display text-[clamp(30px,6vw,42px)] font-medium lowercase tracking-[.08em] leading-none text-gold">
        LUVIIO
      </div>

      <div
        className="spin boot-spinner relative z-[1] h-7 w-7 animate-spin rounded-full border border-white/10 border-t-2 border-t-gold shadow-[0_0_24px_rgba(216,173,106,.10)] motion-reduce:animate-none"
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