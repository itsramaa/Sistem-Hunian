import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';

export default function MerchantReferrals() {
  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">Earn rewards by referring new merchants</p>
        </div>
        <ReferralDashboard userRole="merchant" />
      </div>
    </MerchantLayout>
  );
}
