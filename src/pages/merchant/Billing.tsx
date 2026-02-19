import { useAuth } from "@/features/auth/hooks/useAuth";
import { BillingDashboard } from "@/features/billing/components/BillingDashboard";
import { DisbursementScheduleSettings } from "@/features/payments/components/DisbursementScheduleSettings";
import { SuspensionWarningBanner } from "@/features/users/components/SuspensionWarningBanner";
import { MerchantLayout } from "@/shared/components/layouts/MerchantLayout";

const Billing = () => {
  const { merchant } = useAuth();

  if (!merchant) {
    return (
      <MerchantLayout description="Manage your subscription and billing">
        <div>Loading...</div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout description="Manage your subscription and billing">
      <div className="space-y-6">
        <SuspensionWarningBanner />
        <BillingDashboard customerId={merchant.id} />
        <div className="pt-8 border-t">
          <h2 className="text-lg font-semibold mb-4">Payout Settings</h2>
          <DisbursementScheduleSettings />
        </div>
      </div>
    </MerchantLayout>
  );
};

export default Billing;
