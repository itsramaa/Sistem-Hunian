import { Suspense, lazy, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FileSearch } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ContentSkeleton } from "@/shared/components/ui/PageSkeleton";

const DocumentCenter = lazy(() => import("@/pages/merchant/DocumentCenter"));
const OcrTutorial = lazy(() => import("@/pages/merchant/OcrTutorial"));
const Support = lazy(() => import("@/pages/merchant/Support"));

const TAB_MAP: Record<string, string> = { documents: "documents", ocr: "ocr", support: "support" };

export default function HelpHub() {
  const location = useLocation();
  const hash = location.hash.replace("#", "");
  const [activeTab, setActiveTab] = useState(TAB_MAP[hash] || "documents");

  useEffect(() => {
    if (hash && TAB_MAP[hash]) setActiveTab(TAB_MAP[hash]);
  }, [hash]);

  return (
    <div className="space-y-6">
      <PageHeader icon={FileSearch} title="Pusat Bantuan" description="Dokumen, panduan OCR, dan dukungan" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list">
          <TabsTrigger value="documents" className="pill-tab-trigger">Dokumen</TabsTrigger>
          <TabsTrigger value="ocr" className="pill-tab-trigger">Panduan OCR</TabsTrigger>
          <TabsTrigger value="support" className="pill-tab-trigger">Dukungan</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><DocumentCenter /></Suspense>
        </TabsContent>
        <TabsContent value="ocr" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><OcrTutorial /></Suspense>
        </TabsContent>
        <TabsContent value="support" className="mt-6">
          <Suspense fallback={<ContentSkeleton />}><Support /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
