import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';

export default function StoreLayout() {
  const { token, initializing, refreshProfile } = useAuth();

  // Refresh profile once a session token becomes available (e.g. after login
  // navigates) so the header reflects the current user.
  useEffect(() => {
    if (token) refreshProfile();
  }, [token, refreshProfile]);

  if (initializing) {
    return (
      <div className="boot-screen">
        <div className="boot-brand">LUVIIO</div>
        <div className="spin boot-spinner" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
