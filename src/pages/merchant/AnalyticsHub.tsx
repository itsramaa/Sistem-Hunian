import { Suspense, lazy, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ContentSkeleton } from "@/shared/components/ui/PageSkeleton";

const AnalyticsDashboard = lazy(() => import("@/pages/merchant/AnalyticsDashboard"));
const Reports = lazy(() => import("@/pages/merchant/Reports"));
const ReportTemplates = lazy(() => import("@/pages/merchant/ReportTemplates"));
const ComparativePortfolio = lazy(() => import("@/pages/merchant/ComparativePortfolio"));

const TAB_MAP: Record<string, string> = {
  dashboard: "dashboard", reports: "reports", templates: "templates", portfolio: "portfolio",
};

export default function AnalyticsHub() {
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  const [activeTab, setActiveTab] = useState(TAB_MAP[hash] || "dashboard");

  useEffect(() => {
    if (hash && TAB_MAP[hash]) setActiveTab(TAB_MAP[hash]);
  }, [hash]);

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Analitik Performa" description="Statistik, laporan, dan perbandingan aset" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list flex-wrap">
          <TabsTrigger value="dashboard" className="pill-tab-trigger">Ringkasan</TabsTrigger>
          <TabsTrigger value="reports" className="pill-tab-trigger">Laporan</TabsTrigger>
          <TabsTrigger value="templates" className="pill-tab-trigger">Template</TabsTrigger>
          <TabsTrigger value="portfolio" className="pill-tab-trigger">Portfolio</TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
}
