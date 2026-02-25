import { useAuth } from "@/features/auth/hooks/useAuth";
import { BillingDashboard } from "@/features/billing/components/BillingDashboard";
import { DisbursementScheduleSettings } from "@/features/payments/components/DisbursementScheduleSettings";
import { SuspensionWarningBanner } from "@/features/users/components/SuspensionWarningBanner";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { TabsPageSkeleton } from "@/shared/components/ui/PageSkeleton";
import { Receipt, Wallet } from "lucide-react";

const Billing = () => {
  const { merchant } = useAuth();

  if (!merchant) {
    return <TabsPageSkeleton statsCount={3} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Receipt} title="Tagihan & Langganan" description="Kelola langganan dan pengaturan pencairan dana Anda" />
      <SuspensionWarningBanner />
      <BillingDashboard customerId={merchant.id} />
      <div className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center" aria-hidden="true">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Pengaturan Pembayaran</h3>
        </div>
        <DisbursementScheduleSettings />
      </div>
    </div>
  );
};

export default Billing;