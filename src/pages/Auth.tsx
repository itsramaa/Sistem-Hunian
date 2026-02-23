import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { AuthLoadingSkeleton } from '@/features/auth/components/AuthLoadingSkeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Meta } from '@/shared/components/meta';

const roleDestinations: Record<string, { path: string; name: string }> = {
  admin: { path: '/admin', name: 'Dashboard Admin' },
  merchant: { path: '/merchant', name: 'Dashboard Merchant' },
  vendor: { path: '/vendor', name: 'Dashboard Vendor' },
  tenant: { path: '/tenant', name: 'Dashboard Tenant' },
};

export default function Auth() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && role) {
      const destination = roleDestinations[role] || roleDestinations.merchant;
      navigate(destination.path, { replace: true });
    }
  }, [user, role, isLoading, navigate]);

  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Show loading skeleton when user is authenticated but redirecting
  if (user && role) {
    const destination = roleDestinations[role] || roleDestinations.merchant;
    return <AuthLoadingSkeleton destination={destination.name} />;
  }

  return (
    <>
      <Meta noindex title="Login" description="Masuk ke akun SiHuni Anda" />
      <AuthForm />
    </>
  );
}
