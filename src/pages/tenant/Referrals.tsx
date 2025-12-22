import { TenantLayout } from '@/components/layouts/TenantLayout';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';

export default function TenantReferrals() {
  return (
    <TenantLayout
      title="Refer & Earn"
      description="Share SiHuni with friends and earn rewards"
    >
      <ReferralDashboard userRole="tenant" />
    </TenantLayout>
  );
}
