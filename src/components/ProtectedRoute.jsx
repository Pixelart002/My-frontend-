import { Navigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';

import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui/States';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
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