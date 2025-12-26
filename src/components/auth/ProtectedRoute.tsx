import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

// Helper function to get role display name
function getRoleDisplayName(role: AppRole): string {
  const roleNameMap: Record<AppRole, string> = {
    admin: 'Admin',
    merchant: 'Pemilik Properti',
    vendor: 'Vendor',
    tenant: 'Tenant',
  };
  return roleNameMap[role] || role;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();
  const hasShownToast = useRef(false);

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

  // No role assigned after loading complete - redirect to unauthorized
  if (!role) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check role access
  if (allowedRoles && allowedRoles.length > 0) {
    // Admin can access ALL routes (super access)
    if (role === 'admin') {
      hasShownToast.current = false;
      return <>{children}</>;
    }
    
    // For non-admin roles, check if their role is in allowedRoles
    if (!allowedRoles.includes(role)) {
      // Show toast notification only once per redirect
      if (!hasShownToast.current) {
        hasShownToast.current = true;
        toast.error('Akses Ditolak', {
          description: `Halaman ini hanya dapat diakses oleh ${allowedRoles.map(r => getRoleDisplayName(r as AppRole)).join(', ')}. Anda dialihkan ke dashboard ${getRoleDisplayName(role)}.`,
        });
      }
      // Redirect to their own dashboard
      return <Navigate to={getRedirectPath(role)} replace />;
    }
  }

  // Reset toast flag when accessing allowed page
  hasShownToast.current = false;
  return <>{children}</>;
}
