import { Suspense, lazy, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ContentSkeleton } from "@/shared/components/ui/PageSkeleton";

// Performance (Standard)
const AnalyticsDashboard = lazy(() => import("@/pages/merchant/AnalyticsDashboard"));
const Reports = lazy(() => import("@/pages/merchant/Reports"));
const ReportTemplates = lazy(() => import("@/pages/merchant/ReportTemplates"));
const ComparativePortfolio = lazy(() => import("@/pages/merchant/ComparativePortfolio"));

// Intelligence (AI)
const MlAnalytics = lazy(() => import("@/pages/merchant/MlAnalytics"));
const DssAdvisor = lazy(() => import("@/pages/merchant/DssAdvisor"));
const MarketIntelligence = lazy(() => import("@/pages/merchant/MarketIntelligence"));
const FinancialRisk = lazy(() => import("@/pages/merchant/FinancialRiskAnalytics"));
const TenantQuality = lazy(() => import("@/pages/merchant/TenantQualityScoring"));

const TAB_MAP: Record<string, string> = {
  dashboard: "dashboard",
  reports: "reports",
  templates: "templates",
  portfolio: "portfolio",
  predictions: "predictions",
  strategy: "strategy",
  market: "market",
  risk: "risk",
  quality: "quality",
};

type TabGroup = "performance" | "intelligence";

const GROUP_TABS: Record<TabGroup, string[]> = {
  performance: ["dashboard", "reports", "templates", "portfolio"],
  intelligence: ["predictions", "strategy", "market", "risk", "quality"],
};

function getGroupForTab(tab: string): TabGroup {
  return GROUP_TABS.intelligence.includes(tab) ? "intelligence" : "performance";
}

export default function InsightsHub() {
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  const [activeTab, setActiveTab] = useState(TAB_MAP[hash] || "dashboard");
  const [activeGroup, setActiveGroup] = useState<TabGroup>(getGroupForTab(TAB_MAP[hash] || "dashboard"));

  useEffect(() => {
    if (hash && TAB_MAP[hash]) {
      setActiveTab(TAB_MAP[hash]);
      setActiveGroup(getGroupForTab(TAB_MAP[hash]));
    }
  }, [hash]);

  const handleGroupChange = (group: TabGroup) => {
    setActiveGroup(group);
    setActiveTab(GROUP_TABS[group][0]);
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Wawasan & Data" description="Analitik performa, laporan, dan intelijen AI" />

      {/* Group selector */}
      <div className="flex gap-2">
        <button
          onClick={() => handleGroupChange("performance")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeGroup === "performance"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          📊 Performa
        </button>
        <button
          onClick={() => handleGroupChange("intelligence")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeGroup === "intelligence"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🧠 Intelijen AI
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {activeGroup === "performance" ? (
          <TabsList className="pill-tab-list flex-wrap">
            <TabsTrigger value="dashboard" className="pill-tab-trigger">Ringkasan</TabsTrigger>
            <TabsTrigger value="reports" className="pill-tab-trigger">Laporan</TabsTrigger>
            <TabsTrigger value="templates" className="pill-tab-trigger">Template</TabsTrigger>
            <TabsTrigger value="portfolio" className="pill-tab-trigger">Portfolio</TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="pill-tab-list flex-wrap">
            <TabsTrigger value="predictions" className="pill-tab-trigger">Prediksi</TabsTrigger>
            <TabsTrigger value="strategy" className="pill-tab-trigger">Strategi</TabsTrigger>
            <TabsTrigger value="market" className="pill-tab-trigger">Tren Pasar</TabsTrigger>
            <TabsTrigger value="risk" className="pill-tab-trigger">Risiko</TabsTrigger>
            <TabsTrigger value="quality" className="pill-tab-trigger">Skor Penyewa</TabsTrigger>
          </TabsList>
        )}

        {/* Performance tabs */}
        <TabsContent value="dashboard" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><AnalyticsDashboard /></Suspense>
        </TabsContent>
        <TabsContent value="reports" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><Reports /></Suspense>
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><ReportTemplates /></Suspense>
        </TabsContent>
        <TabsContent value="portfolio" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><ComparativePortfolio /></Suspense>
        </TabsContent>

        {/* Intelligence tabs */}
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
