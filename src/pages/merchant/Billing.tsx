import { useAuth } from "@/features/auth/hooks/useAuth";
import { BillingDashboard } from "@/features/billing/components/BillingDashboard";
import { DisbursementScheduleSettings } from "@/features/payments/components/DisbursementScheduleSettings";
import { SuspensionWarningBanner } from "@/features/users/components/SuspensionWarningBanner";


const Billing = () => {
  const { merchant } = useAuth();

  if (!merchant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <SuspensionWarningBanner />
        <BillingDashboard customerId={merchant.id} />
        <div className="pt-8 border-t">
          <h2 className="text-lg font-semibold mb-4">Payout Settings</h2>
          <DisbursementScheduleSettings />
        </div>
      </div>
    </div>
  );
};

export default Billing;
