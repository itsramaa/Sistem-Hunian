import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function Auth() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && role) {
      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'merchant') {
        navigate('/merchant', { replace: true });
      } else if (role === 'vendor') {
        navigate('/vendor', { replace: true });
      } else {
        navigate('/tenant', { replace: true });
      }
    }
  }, [user, role, isLoading, navigate]);

  if (isLoading) {
    return null;
  }

  return <AuthForm />;
}
