import { Suspense, lazy, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Wrench } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ContentSkeleton } from "@/shared/components/ui/PageSkeleton";

const MerchantMaintenance = lazy(() => import("@/pages/merchant/Maintenance"));
const MerchantCompliance = lazy(() => import("@/pages/merchant/PropertyCompliance"));
const MerchantDataQuality = lazy(() => import("@/pages/merchant/DataQualityHistory"));

const TAB_MAP: Record<string, string> = { maintenance: "maintenance", compliance: "compliance", "data-quality": "data-quality" };

export default function OperationsHub() {
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  const [activeTab, setActiveTab] = useState(TAB_MAP[hash] || "maintenance");

  useEffect(() => {
    if (hash && TAB_MAP[hash]) setActiveTab(TAB_MAP[hash]);
  }, [hash]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Wrench} title="Operasional" description="Kelola pemeliharaan, kepatuhan, dan validasi data properti" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list">
          <TabsTrigger value="maintenance" className="pill-tab-trigger">Maintenance</TabsTrigger>
          <TabsTrigger value="compliance" className="pill-tab-trigger">Kepatuhan</TabsTrigger>
          <TabsTrigger value="data-quality" className="pill-tab-trigger">Validasi Data</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantMaintenance />
          </Suspense>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantCompliance />
          </Suspense>
        </TabsContent>

        <TabsContent value="data-quality" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantDataQuality />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
