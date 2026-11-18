/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingAuthPage } from './pages/LandingAuthPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-zinc-500">
            Loading MotoBay...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingAuthPage />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return <CustomerDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
