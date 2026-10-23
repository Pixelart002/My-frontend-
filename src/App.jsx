import { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import { setPageSeo } from './utils/seo';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

import AppErrorBoundary from './components/AppErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import StoreLayout from './layouts/StoreLayout';

import HomePage from './pages/HomePage';

// A stale HTML document can point at hashed chunks from an older deployment.
// Retry one failed dynamic import with a fresh document, without looping forever.
function importWithChunkRecovery(importer) {
  const key = `__luviio_chunk_retry__:${window.location.pathname}`;

  return importer()
    .then((module) => {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Storage may be disabled.
      }
      return module;
    })
    .catch((error) => {
      const message = String(error?.message || error);
      const isChunkFailure =
        /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk .* failed/i.test(message);

      if (isChunkFailure) {
        try {
          if (!window.sessionStorage.getItem(key)) {
            window.sessionStorage.setItem(key, '1');
            window.location.reload();
          }
        } catch {
          // If storage is unavailable, let the error boundary show recovery UI.
        }
      }

      throw error;
    });
}

const lazyWithChunkRecovery = (importer) =>
  lazy(() => importWithChunkRecovery(importer));

// Keep the first storefront render small; load catalogue-heavy routes on demand.
const ShopPage = lazyWithChunkRecovery(() => import('./pages/ShopPage'));
const ProductDetailPage = lazyWithChunkRecovery(() => import('./pages/ProductDetailPage'));

const LoginPage = lazyWithChunkRecovery(() => import('./pages/LoginPage'));

const RegisterPage = lazyWithChunkRecovery(() => import('./pages/RegisterPage'));

const ForgotPasswordPage = lazyWithChunkRecovery(() => import('./pages/ForgotPasswordPage'));

const ChangePasswordPage = lazyWithChunkRecovery(() => import('./pages/ChangePasswordPage'));

const CartPage = lazyWithChunkRecovery(() => import('./pages/CartPage'));

const CheckoutPage = lazyWithChunkRecovery(() => import('./pages/CheckoutPage'));

const OrderSuccessPage = lazyWithChunkRecovery(() => import('./pages/OrderSuccessPage'));

const OrderFailedPage = lazyWithChunkRecovery(() => import('./pages/OrderFailedPage'));

const OrdersPage = lazyWithChunkRecovery(() => import('./pages/OrdersPage'));

const SubscriptionPage = lazyWithChunkRecovery(() => import('./pages/SubscriptionPage'));

const OrderDetailPage = lazyWithChunkRecovery(() => import('./pages/OrderDetailPage'));

const ProfilePage = lazyWithChunkRecovery(() => import('./pages/ProfilePage'));

const AddressesPage = lazyWithChunkRecovery(() => import('./pages/AddressesPage'));

const SettingsPage = lazyWithChunkRecovery(() => import('./pages/SettingsPage'));

const PrivacyPage = lazyWithChunkRecovery(() => import('./pages/policies/PrivacyPage'));

const DPDPNoticePage = lazyWithChunkRecovery(() => import('./pages/policies/DPDPNoticePage'));

const TermsPage = lazyWithChunkRecovery(() => import('./pages/policies/TermsPage'));

const ShippingPage = lazyWithChunkRecovery(() => import('./pages/policies/ShippingPage'));

const RefundPage = lazyWithChunkRecovery(() => import('./pages/policies/RefundPage'));

const ReturnCancelPage = lazyWithChunkRecovery(() => import('./pages/policies/ReturnCancelPage'));

const AboutPage = lazyWithChunkRecovery(() => import('./pages/policies/AboutPage'));

const ReviewsPage = lazyWithChunkRecovery(() => import('./pages/ReviewsPage'));

const NotFoundPage = lazyWithChunkRecovery(() => import('./pages/NotFoundPage'));

const AdminPage = lazyWithChunkRecovery(() => import('./pages/admin/AdminPage'));

function StoreRoutes() {
  return (
    <Route element={<StoreLayout />}>
      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/shop"
        element={<ShopPage />}
      />

      <Route
        path="/product"
        element={<ProductDetailPage />}
      />

      <Route
        path="/product/:slug"
        element={<ProductDetailPage />}
      />

      <Route
        path="/reviews"
        element={<ReviewsPage />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/cart"
        element={<CartPage />}
      />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/order/success"
        element={
          <ProtectedRoute>
            <OrderSuccessPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/order/failed"
        element={
          <ProtectedRoute>
            <OrderFailedPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/addresses"
        element={
          <ProtectedRoute>
            <AddressesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/privacy"
        element={<PrivacyPage />}
      />

      <Route
        path="/privacy/dpdp"
        element={<DPDPNoticePage />}
      />

      <Route
        path="/terms"
        element={<TermsPage />}
      />

      <Route
        path="/shipping"
        element={<ShippingPage />}
      />

      <Route
        path="/refund"
        element={<RefundPage />}
      />

      <Route
        path="/returns"
        element={<ReturnCancelPage />}
      />

      <Route
        path="/about"
        element={<AboutPage />}
      />

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Route>
  );
}

function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isPrivateRoute =
      /^\/(?:cart|checkout|orders?(?:\/|$)|account(?:\/|$)|admin(?:\/|$)|order\/)/.test(
        pathname,
      );

    const isAuthRoute =
      /^\/(?:login|register|forgot-password|change-password)(?:\/|$)/.test(
        pathname,
      );

    if (isPrivateRoute || isAuthRoute) {
      setPageSeo({
        path: pathname,
        noindex: true,
      });
      return;
    }

    // ProductDetailPage owns dynamic product SEO.
    if (!pathname.startsWith('/product')) {
      setPageSeo({
        path: pathname,
      });
    }
  }, [pathname]);

  return null;
}

function LoadingFallback() {
  return (
    <main className="flex min-h-[50vh] items-center justify-center px-5 py-16 text-text">
      <div
        className="flex items-center gap-3 text-sm text-muted"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-gold motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span>Loading…</span>
      </div>
    </main>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();
  const hostname = window.location.hostname.toLowerCase().replace(/\.$/, '');
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');

  // Keep each production hostname scoped to its own application surface.
  // Login remains available on the admin hostname so authenticated staff can
  // return to /admin; API permissions remain the actual authorization boundary.
  if (
    hostname === 'admin.luviio.in' &&
    !isAdminPath &&
    pathname !== '/login'
  ) {
    return <Navigate to="/admin" replace />;
  }

  if (hostname === 'app.luviio.in' && isAdminPath) {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <RouteSeo />

      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {StoreRoutes()}

      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </AppErrorBoundary>
  );
}