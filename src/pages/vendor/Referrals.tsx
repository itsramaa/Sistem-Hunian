import { VendorLayout } from '@/components/layouts/VendorLayout';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';

export default function VendorReferrals() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">Earn rewards by referring other vendors</p>
        </div>
        <ReferralDashboard userRole="vendor" />
      </div>
    </VendorLayout>
  );
}
