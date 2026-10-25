import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationRealtime } from '../hooks/useNotificationRealtime';
import { useSessionRefresh } from '../hooks/useSessionRefresh';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../store/uiStore';

const SUPER_ADMIN_PATHS = ['/security/admin-users', '/shipments/carriers'];

export function AdminLayout() {
  const { isAuthenticated, isInitializing, hasInitialized, checkAuth, user } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  useSessionRefresh(isAuthenticated);
  useNotificationRealtime(isAuthenticated);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (hasInitialized && !isInitializing && !isAuthenticated && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [hasInitialized, isInitializing, isAuthenticated, navigate, location]);

  useEffect(() => {
    if (hasInitialized && !isInitializing && isAuthenticated && SUPER_ADMIN_PATHS.some((p) => location.pathname.startsWith(p))) {
      if (!user?.isSuperAdmin) {
        navigate('/');
      }
    }
  }, [hasInitialized, isInitializing, isAuthenticated, location.pathname, user?.isSuperAdmin, navigate]);

  if (!hasInitialized || isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
