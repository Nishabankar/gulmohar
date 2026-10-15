import React, { useState } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { SITE_URL } from './config';

// HouseDeal CRM: login screen until a token exists, then the dashboard.
// Password-reset email links (?resetPassword / ?otp / ?token) land here and are handled by AdminLogin.
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('adminToken'));

  const handleLoginSuccess = () => {
    localStorage.removeItem('lms_dashboard_nav_state');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('lms_dashboard_nav_state');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div class="fixed inset-0 h-screen h-[100dvh] max-h-screen bg-gray-50 overflow-hidden w-full max-w-full flex flex-col z-0">
      <AdminDashboard
        onLogout={handleLogout}
        onGoHome={() => { if (SITE_URL) window.open(SITE_URL, '_blank', 'noopener'); }}
      />
    </div>
  );
}
