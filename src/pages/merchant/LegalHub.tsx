import { Suspense, lazy, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Shield } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ContentSkeleton } from "@/shared/components/ui/PageSkeleton";

const MerchantCompliance = lazy(() => import("@/pages/merchant/PropertyCompliance"));
const MerchantDataQuality = lazy(() => import("@/pages/merchant/DataQualityHistory"));

const TAB_MAP: Record<string, string> = { compliance: "compliance", "data-quality": "data-quality" };

export default function LegalHub() {
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  const [activeTab, setActiveTab] = useState(TAB_MAP[hash] || "compliance");

  useEffect(() => {
    if (hash && TAB_MAP[hash]) setActiveTab(TAB_MAP[hash]);
  }, [hash]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Shield} title="Kepatuhan & Legalitas" description="Kelola compliance dan validasi data properti" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list">
          <TabsTrigger value="compliance" className="pill-tab-trigger">Kepatuhan</TabsTrigger>
          <TabsTrigger value="data-quality" className="pill-tab-trigger">Validasi Data</TabsTrigger>
        </TabsList>

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
