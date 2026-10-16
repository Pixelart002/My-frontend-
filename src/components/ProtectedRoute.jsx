import { Navigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';

import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui/States';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing, restoreError, retrySession } = useAuth();
  const location = useLocation();
  
  const returnTo = useMemo(() => {
    return `${location.pathname}${location.search}${location.hash}`;
  }, [
    location.pathname,
    location.search,
    location.hash,
  ]);
  
  if (initializing) {
    return (
      <main
        className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="w-full max-w-md">
          <Spinner label="Loading your session…" />
        </div>
      </main>
    );
  }
  
  if (restoreError) {
    return (
      <main
        className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
        role="alert"
        aria-live="polite"
      >
        <section className="w-full max-w-md rounded-xl border border-line p-6 text-center">
          <h1 className="text-lg font-semibold text-text">Session could not be restored</h1>
          <p className="mt-2 text-sm text-muted">
            Your session has not been deleted. Check your connection and try loading it again.
          </p>
          <button
            className="btn mt-5"
            type="button"
            onClick={retrySession}
          >
            Retry session
          </button>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: returnTo,
        }}
      />
    );
  }
  
  return children;
}