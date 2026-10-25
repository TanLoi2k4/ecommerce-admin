import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, isInitializing, hasInitialized } = useAuthStore();

  if (!hasInitialized || isInitializing) return null;
  if (!user?.isSuperAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
