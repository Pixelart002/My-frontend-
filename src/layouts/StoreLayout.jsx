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
      className="fixed inset-0 z-[100] grid min-w-[320px] place-items-center overflow-hidden bg-[#080808] text-text"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[min(72vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex w-full max-w-xs flex-col items-center px-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-3xl border border-gold/20 bg-gold-dim shadow-[0_18px_60px_rgba(216,173,106,.08)]">
          <span className="font-display text-3xl font-semibold tracking-[0.08em] text-gold">
            L
          </span>
        </div>

        <h1 className="mt-6 font-display text-3xl font-medium tracking-[0.08em] text-gold">
          LUVIIO
        </h1>

        <p className="mt-2 text-xs font-medium tracking-[0.12em] text-muted">
          EVERYDAY HARDWARE · DONE RIGHT
        </p>

        <div className="mt-8 flex items-center gap-3" aria-hidden="true">
          <span className="relative flex size-9 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-white/10" />
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin motion-reduce:animate-none" />
            <span className="size-1.5 rounded-full bg-gold" />
          </span>
          <span className="text-sm font-medium text-muted">
            Loading your store…
          </span>
        </div>

        <div className="mt-7 h-px w-40 overflow-hidden bg-white/10" aria-hidden="true">
          <div className="h-full w-2/5 animate-pulse bg-gold/70 motion-reduce:animate-none" />
        </div>

        <span className="sr-only">
          Loading Luviio…
        </span>
      </div>
    </div>
  );
}
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