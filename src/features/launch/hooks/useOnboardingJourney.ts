import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantDashboardStats } from '@/features/dashboard/hooks/useMerchantDashboardStats';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';

export type OnboardingStatus = 'completed' | 'active' | 'blocking' | 'pending';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  status: OnboardingStatus;
  path?: string;
  blockingLabel?: string;
}

export function useOnboardingJourney() {
  const { merchant } = useAuth();
  const { data: stats } = useMerchantDashboardStats();
  const merchantId = merchant?.id;

  // Query pending invitations
  const { data: invitationData } = useQuery({
    queryKey: ['onboarding-invitations', merchantId],
    queryFn: async () => {
      const { count: pendingCount } = await supabase
        .from('tenant_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantId!)
        .eq('status', 'pending');

      const { count: acceptedCount } = await supabase
        .from('tenant_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantId!)
        .eq('status', 'accepted');

      return { pending: pendingCount || 0, accepted: acceptedCount || 0 };
    },
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000,
  });

  // Query contract signature status
  const { data: contractData } = useQuery({
    queryKey: ['onboarding-contracts', merchantId],
    queryFn: async () => {
      const { count: totalContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantId!);

      const { count: signedContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantId!)
        .eq('signature_status', 'fully_signed');

      return { total: totalContracts || 0, signed: signedContracts || 0 };
    },
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000,
  });

  // Query first payment
  const { data: paymentData } = useQuery({
    queryKey: ['onboarding-payments', merchantId],
    queryFn: async () => {
      const { count } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantId!)
        .eq('status', 'paid');
      return { hasPaid: (count || 0) > 0 };
    },
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000,
  });

  // Compute step completions (raw, before sequential gating)
  const profileDone = !!merchant?.business_name && merchant.business_name !== 'My Business';
  const verificationStatus = merchant?.verification_status || 'pending';
  const verificationDone = verificationStatus === 'verified';
  const hasProperty = (stats?.properties.total || 0) > 0;
  const hasUnit = (stats?.properties.totalUnits || 0) > 0;
  const hasInvitation = (invitationData?.pending || 0) > 0 || (invitationData?.accepted || 0) > 0;
  const hasActiveTenant = (stats?.tenants.active || 0) > 0;
  const tenantAccepted = hasActiveTenant || (invitationData?.accepted || 0) > 0;
  const hasContract = (contractData?.total || 0) > 0;
  const contractSigned = (contractData?.signed || 0) > 0;
  const hasPaidPayment = paymentData?.hasPaid || (stats?.financials.monthlyRevenue || 0) > 0;

  // Sequential gating: compute status for each step
  function computeSteps(): OnboardingStep[] {
    const steps: OnboardingStep[] = [];
    let blocked = false;

    const addStep = (
      id: string,
      label: string,
      description: string,
      done: boolean,
      isBlocking: boolean,
      blockingLabel?: string,
      path?: string,
    ) => {
      let status: OnboardingStatus;
      if (blocked) {
        status = 'pending';
      } else if (done) {
        status = 'completed';
      } else if (isBlocking) {
        status = 'blocking';
        blocked = true;
      } else {
        status = 'active';
        blocked = true;
      }
      steps.push({ id, label, description, status, path, blockingLabel: status === 'blocking' ? blockingLabel : undefined });
    };

    // 1. Registration - always done
    addStep('register', 'Registrasi akun', 'Akun berhasil dibuat', true, false);

    // 2. Profile
    addStep('profile', 'Lengkapi profil bisnis', 'Nama bisnis, alamat, dan info kontak', profileDone, false, undefined, '/merchant/profile');

    // 3. Verification (blocking - depends on admin)
    addStep('verification', 'Verifikasi admin', verificationDone ? 'Bisnis terverifikasi' : 'Menunggu verifikasi dari admin...', verificationDone, !verificationDone, 'Menunggu verifikasi admin');

    // 4. Property
    addStep('property', 'Tambah properti pertama', 'Daftarkan kos/apartemen Anda', hasProperty, false, undefined, '/merchant/properties');

    // 5. Unit
    addStep('unit', 'Buat unit di properti', 'Tambah kamar/unit yang tersedia', hasUnit, false, undefined, '/merchant/properties');

    // 6. Invite tenant
    addStep('invite', 'Undang penyewa', 'Kirim undangan ke calon penyewa', hasInvitation || hasActiveTenant, false, undefined, '/merchant/tenants');

    // 7. Tenant accepts (blocking - depends on tenant)
    addStep('tenant_accept', 'Penyewa menerima undangan', tenantAccepted ? 'Penyewa bergabung' : 'Menunggu penyewa menerima undangan...', tenantAccepted, !tenantAccepted && hasInvitation, 'Menunggu respons penyewa');

    // 8. Create contract
    addStep('contract', 'Buat kontrak', 'Buat kontrak sewa untuk penyewa', hasContract, false, undefined, '/merchant/contracts');

    // 9. Sign contract (blocking - depends on both parties)
    addStep('sign_contract', 'Tanda tangan kontrak', contractSigned ? 'Kontrak ditandatangani' : 'Menunggu tanda tangan kedua belah pihak...', contractSigned, !contractSigned && hasContract, 'Menunggu tanda tangan');

    // 10. First payment (blocking - depends on tenant)
    addStep('first_payment', 'Pembayaran pertama', hasPaidPayment ? 'Pembayaran diterima' : 'Menunggu pembayaran dari penyewa...', hasPaidPayment, !hasPaidPayment && contractSigned, 'Menunggu pembayaran');

    return steps;
  }

  const steps = computeSteps();
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progress = (completedCount / steps.length) * 100;
  const allDone = completedCount === steps.length;

  return { steps, completedCount, totalSteps: steps.length, progress, allDone };
}
