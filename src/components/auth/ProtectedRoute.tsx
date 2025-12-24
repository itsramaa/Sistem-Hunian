import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

// Helper function to get redirect path based on role
function getRedirectPath(role: AppRole): string {
  const rolePathMap: Record<AppRole, string> = {
    admin: '/admin',
    merchant: '/merchant',
    vendor: '/vendor',
    tenant: '/tenant',
  };
  return rolePathMap[role] || '/';
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // No role yet (still loading or no role assigned)
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check role access
  if (allowedRoles && allowedRoles.length > 0) {
    // Admin can access ALL routes (super access)
    if (role === 'admin') {
      return <>{children}</>;
    }
    
    // For non-admin roles, check if their role is in allowedRoles
    if (!allowedRoles.includes(role)) {
      // Redirect to their own dashboard
      return <Navigate to={getRedirectPath(role)} replace />;
    }
  }

  return <>{children}</>;
}
