import { MerchantLayout } from "@/components/layouts/MerchantLayout";
import { SubscriptionPayment } from "@/components/merchant/SubscriptionPayment";
import { SubscriptionWidget } from "@/components/merchant/SubscriptionWidget";
import { SubscriptionInvoiceHistory } from "@/components/merchant/SubscriptionInvoiceHistory";
import { SuspensionWarningBanner } from "@/components/merchant/SuspensionWarningBanner";
import { PendingSubscriptionChanges } from "@/components/merchant/PendingSubscriptionChanges";
import { DisbursementScheduleSettings } from "@/components/merchant/DisbursementScheduleSettings";

const Billing = () => {
  return (
    <MerchantLayout description="Manage your subscription and billing">
      <div className="space-y-6">
        <SuspensionWarningBanner />
        <SubscriptionWidget />
        <PendingSubscriptionChanges />
        <SubscriptionPayment />
        <SubscriptionInvoiceHistory />
        <DisbursementScheduleSettings />
      </div>
    </MerchantLayout>
  );
};

export default Billing;
