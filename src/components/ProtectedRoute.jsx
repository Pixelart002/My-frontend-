import { Navigate, useLocation } from 'react-router-dom';
import { RiShieldCheckLine } from '@remixicon/react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui/States';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="page-shell page-shell-compact">
        <Spinner label="Checking your secure session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return (
    <div className="protected-content-shell">
      <div className="secure-access-indicator" aria-label="Secure access enabled">
        <RiShieldCheckLine size={16} />
        <span>Secure access</span>
      </div>
      {children}
    </div>
  );
}
