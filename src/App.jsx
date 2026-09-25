import { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter,
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
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';

const LoginPage = lazy(() => import('./pages/LoginPage'));

const RegisterPage = lazy(() => import('./pages/RegisterPage'));

const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));

const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));

const CartPage = lazy(() =>
  import('./pages/CartPage'),
);

const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage'),
);

const OrderSuccessPage = lazy(() =>
  import('./pages/OrderSuccessPage'),
);

const OrderFailedPage = lazy(() =>
  import('./pages/OrderFailedPage'),
);

const OrdersPage = lazy(() =>
  import('./pages/OrdersPage'),
);

const OrderDetailPage = lazy(() =>
  import('./pages/OrderDetailPage'),
);

const ProfilePage = lazy(() =>
  import('./pages/ProfilePage'),
);

const AddressesPage = lazy(() =>
  import('./pages/AddressesPage'),
);

const SettingsPage = lazy(() =>
  import('./pages/SettingsPage'),
);

const PrivacyPage = lazy(() =>
  import('./pages/policies/PrivacyPage'),
);

const DPDPNoticePage = lazy(() =>
  import('./pages/policies/DPDPNoticePage'),
);

const TermsPage = lazy(() =>
  import('./pages/policies/TermsPage'),
);

const ShippingPage = lazy(() =>
  import('./pages/policies/ShippingPage'),
);

const RefundPage = lazy(() =>
  import('./pages/policies/RefundPage'),
);

const ReturnCancelPage = lazy(() =>
  import('./pages/policies/ReturnCancelPage'),
);

const AboutPage = lazy(() =>
  import('./pages/policies/AboutPage'),
);

const ReviewsPage = lazy(() =>
  import('./pages/ReviewsPage'),
);

const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage'),
);

const AdminPage = lazy(() =>
  import('./pages/admin/AdminPage'),
);

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
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RouteSeo />

      <Routes>
        {StoreRoutes()}

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