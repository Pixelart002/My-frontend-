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
        className="auth-route-loading page"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="container auth-route-loading-inner">
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