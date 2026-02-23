import { Suspense, lazy, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Brain } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ContentSkeleton } from "@/shared/components/ui/PageSkeleton";

const MlAnalytics = lazy(() => import("@/pages/merchant/MlAnalytics"));
const DssAdvisor = lazy(() => import("@/pages/merchant/DssAdvisor"));
const MarketIntelligence = lazy(() => import("@/pages/merchant/MarketIntelligence"));
const FinancialRisk = lazy(() => import("@/pages/merchant/FinancialRiskAnalytics"));
const TenantQuality = lazy(() => import("@/pages/merchant/TenantQualityScoring"));

const TAB_MAP: Record<string, string> = {
  predictions: "predictions", strategy: "strategy", market: "market", risk: "risk", quality: "quality",
};

export default function AiInsightsHub() {
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  const [activeTab, setActiveTab] = useState(TAB_MAP[hash] || "predictions");

  useEffect(() => {
    if (hash && TAB_MAP[hash]) setActiveTab(TAB_MAP[hash]);
  }, [hash]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Brain} title="Intelijen AI" description="Prediksi, strategi, dan analisis cerdas" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list flex-wrap">
          <TabsTrigger value="predictions" className="pill-tab-trigger">Prediksi</TabsTrigger>
          <TabsTrigger value="strategy" className="pill-tab-trigger">Strategi</TabsTrigger>
          <TabsTrigger value="market" className="pill-tab-trigger">Tren Pasar</TabsTrigger>
          <TabsTrigger value="risk" className="pill-tab-trigger">Risiko</TabsTrigger>
          <TabsTrigger value="quality" className="pill-tab-trigger">Skor Penyewa</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><MlAnalytics /></Suspense>
        </TabsContent>
        <TabsContent value="strategy" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><DssAdvisor /></Suspense>
        </TabsContent>
        <TabsContent value="market" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><MarketIntelligence /></Suspense>
        </TabsContent>
        <TabsContent value="risk" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><FinancialRisk /></Suspense>
        </TabsContent>
        <TabsContent value="quality" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><TenantQuality /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
