import { MerchantLayout } from "@/components/layouts/MerchantLayout";
import { SubscriptionPayment } from "@/components/merchant/SubscriptionPayment";
import { SubscriptionWidget } from "@/components/merchant/SubscriptionWidget";
import { DisbursementScheduleSettings } from "@/components/merchant/DisbursementScheduleSettings";

const Billing = () => {
  return (
    <MerchantLayout description="Manage your subscription and billing">
      <div className="space-y-6">
        <SubscriptionWidget />
        <SubscriptionPayment />
        <DisbursementScheduleSettings />
      </div>
    </MerchantLayout>
  );
};

export default Billing;
