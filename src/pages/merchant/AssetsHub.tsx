import { Suspense, lazy, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ContentSkeleton } from "@/shared/components/ui/PageSkeleton";

const MerchantProperties = lazy(() => import("@/pages/merchant/Properties"));
const MerchantUnits = lazy(() => import("@/pages/merchant/Units"));

const TAB_MAP: Record<string, string> = { properties: "properties", units: "units" };

export default function AssetsHub() {
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  const [activeTab, setActiveTab] = useState(TAB_MAP[hash] || "properties");

  useEffect(() => {
    if (hash && TAB_MAP[hash]) setActiveTab(TAB_MAP[hash]);
  }, [hash]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Building2} title="Properti & Unit" description="Kelola properti dan unit Anda dalam satu tampilan" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list">
          <TabsTrigger value="properties" className="pill-tab-trigger">Properti</TabsTrigger>
          <TabsTrigger value="units" className="pill-tab-trigger">Unit</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantProperties />
          </Suspense>
        </TabsContent>

        <TabsContent value="units" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <MerchantUnits />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
