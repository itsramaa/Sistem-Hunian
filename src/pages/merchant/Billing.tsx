import { useAuth } from "@/features/auth/hooks/useAuth";
import { BillingDashboard } from "@/features/billing/components/BillingDashboard";
import { DisbursementScheduleSettings } from "@/features/payments/components/DisbursementScheduleSettings";
import { SuspensionWarningBanner } from "@/features/users/components/SuspensionWarningBanner";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { TabsPageSkeleton } from "@/shared/components/ui/PageSkeleton";
import { Receipt } from "lucide-react";

const Billing = () => {
  const { merchant } = useAuth();

  if (!merchant) {
    return <TabsPageSkeleton statsCount={3} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Receipt} title="Billing & Subscription" description="Manage your subscription and payout settings" />
      <SuspensionWarningBanner />
      <BillingDashboard customerId={merchant.id} />
      <div className="pt-8 border-t">
        <h3 className="text-lg font-semibold mb-4">Payout Settings</h3>
        <DisbursementScheduleSettings />
      </div>
    </div>
  );
};

export default Billing;
