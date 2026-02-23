import { Suspense, lazy, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Users } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ContentSkeleton } from "@/shared/components/ui/PageSkeleton";

const MerchantTenants = lazy(() => import("@/pages/merchant/Tenants"));
const MerchantMoveOuts = lazy(() => import("@/pages/merchant/MoveOuts"));
const MerchantTenantAnalytics = lazy(() => import("@/pages/merchant/TenantAnalytics"));

const TAB_MAP: Record<string, string> = { tenants: "tenants", "move-outs": "move-outs", analytics: "analytics" };

export default function OccupancyHub() {
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  const [activeTab, setActiveTab] = useState(TAB_MAP[hash] || "tenants");

  useEffect(() => {
    if (hash && TAB_MAP[hash]) setActiveTab(TAB_MAP[hash]);
  }, [hash]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Penyewa & Okupansi" description="Kelola penyewa, pindah keluar, dan analitik penghuni" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list">
          <TabsTrigger value="tenants" className="pill-tab-trigger">Penyewa</TabsTrigger>
          <TabsTrigger value="move-outs" className="pill-tab-trigger">Pindah Keluar</TabsTrigger>
          <TabsTrigger value="analytics" className="pill-tab-trigger">Analitik</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantTenants />
          </Suspense>
        </TabsContent>

        <TabsContent value="move-outs" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantMoveOuts />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantTenantAnalytics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
