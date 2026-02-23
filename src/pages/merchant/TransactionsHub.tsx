import { Suspense, lazy, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ContentSkeleton } from "@/shared/components/ui/PageSkeleton";

const MerchantInvoices = lazy(() => import("@/pages/merchant/Invoices"));
const MerchantPayments = lazy(() => import("@/pages/merchant/Payments"));

const TAB_MAP: Record<string, string> = { invoices: "invoices", payments: "payments" };

export default function TransactionsHub() {
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  const [activeTab, setActiveTab] = useState(TAB_MAP[hash] || "invoices");

  useEffect(() => {
    if (hash && TAB_MAP[hash]) setActiveTab(TAB_MAP[hash]);
  }, [hash]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Wallet} title="Transaksi & Tagihan" description="Kelola tagihan dan pembayaran masuk" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list">
          <TabsTrigger value="invoices" className="pill-tab-trigger">Tagihan</TabsTrigger>
          <TabsTrigger value="payments" className="pill-tab-trigger">Pembayaran</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantInvoices />
          </Suspense>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantPayments />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
