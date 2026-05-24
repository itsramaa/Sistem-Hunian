import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TenantLayout } from '@/shared/components/layouts/TenantLayout';
import { ReferralDashboard } from '@/features/referrals/components/ReferralDashboard';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function TenantReferrals() {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      // Verify tenant role
      if (role && role !== 'tenant') {
        navigate('/unauthorized');
        return;
      }
      
      setIsVerifying(false);
    }
  }, [user, role, authLoading, navigate]);

  if (authLoading || isVerifying) {
    return (
      <TenantLayout title="Refer & Earn">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Memverifikasi akses...</p>
            </div>
          </CardContent>
        </Card>
      </TenantLayout>
    );
  }

  if (!user) {
    return (
      <TenantLayout title="Refer & Earn">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-muted-foreground">
                Anda harus login untuk mengakses halaman ini.
              </p>
              <Button onClick={() => navigate('/auth')}>Login</Button>
            </div>
          </CardContent>
        </Card>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout
      title="Refer & Earn"
      description="Bagikan SiHuni ke teman dan dapatkan reward"
    >
      <ReferralDashboard userRole="tenant" />
    </TenantLayout>
  );
}
