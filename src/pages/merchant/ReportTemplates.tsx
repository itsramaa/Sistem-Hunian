import { useState } from "react";
import {
  FileText, BarChart3, DollarSign, Shield, TrendingUp, Loader2,
  Download, Calendar, Clock, AlertCircle, CheckSquare,
} from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { useMerchantProperties } from "@/features/properties/hooks/useMerchantProperties";
import {
  useExecutiveSummary,
  usePropertyAnalysis,
  useFinancialPerformance,
  useRiskAssessment,
  useInvestmentOpportunity,
} from "@/features/analytics/hooks/useReportTemplates";
import { exportToPDF, exportToCSV, exportToExcel, generateReportHTML } from "@/shared/utils/exportUtils";
import { formatRupiah } from "@/shared/utils/utils";
import { format } from "date-fns";
import { toast } from "sonner";

type TemplateType = "executive" | "property" | "financial" | "risk" | "investment";

const TEMPLATES: { type: TemplateType; icon: typeof FileText; title: string; description: string; needsProperty: boolean }[] = [
  { type: "executive", icon: BarChart3, title: "Executive Summary", description: "Ringkasan KPI: revenue, okupansi, risiko, ROI", needsProperty: false },
  { type: "property", icon: FileText, title: "Analisis Properti Detail", description: "Detail unit, kontrak, dan maintenance per properti", needsProperty: true },
  { type: "financial", icon: DollarSign, title: "Kinerja Keuangan", description: "P&L, ROI, dan analisis investasi semua properti", needsProperty: false },
  { type: "risk", icon: Shield, title: "Penilaian Risiko", description: "Risiko bencana, tenant, dan kepatuhan", needsProperty: false },
  { type: "investment", icon: TrendingUp, title: "Peluang Investasi", description: "Ranking ROI dan rekomendasi investasi", needsProperty: false },
];

const METRICS = [
  { key: "revenue", label: "Pendapatan" },
  { key: "occupancy", label: "Okupansi" },
  { key: "roi", label: "ROI" },
  { key: "risk", label: "Skor Risiko" },
  { key: "maintenance", label: "Maintenance" },
];

const DIMENSIONS = [
  { key: "property", label: "Per Properti" },
  { key: "month", label: "Per Bulan" },
  { key: "unit_type", label: "Per Tipe Unit" },
];

export default function ReportTemplates() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  // Custom builder state
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["revenue", "occupancy"]);
  const [selectedDimension, setSelectedDimension] = useState("property");
  const [customPreview, setCustomPreview] = useState<Record<string, unknown>[] | null>(null);
  const [buildingCustom, setBuildingCustom] = useState(false);

  // Reminder state
  const [reminders, setReminders] = useState<{ schedule: string; template: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("report_reminders") || "[]");
    } catch { return []; }
  });

  const { data: merchant } = useQuery({
    queryKey: ["merchant-for-reports", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("merchants").select("id").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const merchantId = merchant?.id || "";
  const { properties } = useMerchantProperties(merchantId);

  const executive = useExecutiveSummary(merchantId, selectedTemplate === "executive");
  const propertyAnalysis = usePropertyAnalysis(merchantId, selectedPropertyId, selectedTemplate === "property" && !!selectedPropertyId);
  const financial = useFinancialPerformance(merchantId, selectedTemplate === "financial");
  const riskAssessment = useRiskAssessment(merchantId, selectedTemplate === "risk");
  const investment = useInvestmentOpportunity(merchantId, selectedTemplate === "investment");

  const handleGenerate = async (tmpl: TemplateType, exportType: "pdf" | "excel") => {
    setGenerating(true);
    setSelectedTemplate(tmpl);

    // Wait for data
    await new Promise(r => setTimeout(r, 1500));

    try {
      switch (tmpl) {
        case "executive": {
          const d = executive.data;
          if (!d) { toast.error("Data belum tersedia"); break; }
          const html = generateReportHTML(
            [{ metric: "Total Properti", value: String(d.totalProperties) },
             { metric: "Total Unit", value: String(d.totalUnits) },
             { metric: "Unit Terisi", value: String(d.occupiedUnits) },
             { metric: "Okupansi", value: `${d.occupancyRate.toFixed(1)}%` },
             { metric: "Total Revenue", value: formatRupiah(d.totalRevenue) },
             { metric: "Maintenance Pending", value: String(d.pendingMaintenance) },
             { metric: "Avg Risk Score", value: d.avgRiskScore.toFixed(1) }] as any,
            [{ key: "metric", label: "Metrik" }, { key: "value", label: "Nilai" }]
          );
          if (exportType === "pdf") {
            exportToPDF("Executive Summary Report", html, "executive_summary");
          } else {
            exportToExcel(
              [{ metric: "Total Properti", value: d.totalProperties },
               { metric: "Total Unit", value: d.totalUnits },
               { metric: "Okupansi", value: `${d.occupancyRate.toFixed(1)}%` },
               { metric: "Total Revenue", value: d.totalRevenue },
               { metric: "Maintenance Pending", value: d.pendingMaintenance }] as any,
              "executive_summary",
              [{ key: "metric", label: "Metrik" }, { key: "value", label: "Nilai" }]
            );
          }
          toast.success("Report berhasil di-generate!");
          break;
        }
        case "property": {
          const d = propertyAnalysis.data;
          if (!d) { toast.error("Data belum tersedia. Pilih properti terlebih dahulu."); break; }
          const rows = d.units.map(u => ({
            unit: u.unit_number, status: u.status, rent: formatRupiah(u.rent_amount),
          }));
          const summary = [
            { label: "Properti", value: d.property.name },
            { label: "Total Unit", value: String(d.property.total_units) },
            { label: "Terisi", value: String(d.property.occupied_units) },
            { label: "Kontrak Aktif", value: String(d.activeContracts) },
            { label: "Maintenance Total", value: String(d.maintenanceRequests.total) },
          ];
          const html = generateReportHTML(rows as any, [
            { key: "unit", label: "Unit" }, { key: "status", label: "Status" }, { key: "rent", label: "Sewa" },
          ], summary);
          if (exportType === "pdf") {
            exportToPDF(`Analisis Properti - ${d.property.name}`, html, "property_analysis");
          } else {
            exportToExcel(rows as any, "property_analysis", [
              { key: "unit", label: "Unit" }, { key: "status", label: "Status" }, { key: "rent", label: "Sewa" },
            ]);
          }
          toast.success("Report berhasil di-generate!");
          break;
        }
        case "financial": {
          const d = financial.data;
          if (!d) { toast.error("Data belum tersedia"); break; }
          const rows = d.properties.map(p => ({
            name: p.name, revenue: formatRupiah(p.revenue), roi: `${p.roi.toFixed(1)}%`,
          }));
          const summary = [
            { label: "Total Revenue", value: formatRupiah(d.totalRevenue) },
            { label: "Total Expenses", value: formatRupiah(d.totalExpenses) },
            { label: "Net Income", value: formatRupiah(d.totalNetIncome) },
          ];
          const html = generateReportHTML(rows as any, [
            { key: "name", label: "Properti" }, { key: "revenue", label: "Revenue" }, { key: "roi", label: "ROI" },
          ], summary);
          if (exportType === "pdf") exportToPDF("Laporan Kinerja Keuangan", html, "financial_performance");
          else exportToExcel(rows as any, "financial_performance", [
            { key: "name", label: "Properti" }, { key: "revenue", label: "Revenue" }, { key: "roi", label: "ROI" },
          ]);
          toast.success("Report berhasil di-generate!");
          break;
        }
        case "risk": {
          const d = riskAssessment.data;
          if (!d) { toast.error("Data belum tersedia"); break; }
          const rows = d.properties.map(p => ({
            name: p.name, zone: p.disasterRiskLevel, score: p.overallRiskScore,
            flood: p.floodRisk, earthquake: p.earthquakeRisk, fire: p.fireRisk,
          }));
          const html = generateReportHTML(rows as any, [
            { key: "name", label: "Properti" }, { key: "zone", label: "Zona" }, { key: "score", label: "Skor" },
            { key: "flood", label: "Banjir" }, { key: "earthquake", label: "Gempa" }, { key: "fire", label: "Kebakaran" },
          ]);
          if (exportType === "pdf") exportToPDF("Laporan Penilaian Risiko", html, "risk_assessment");
          else exportToExcel(rows as any, "risk_assessment");
          toast.success("Report berhasil di-generate!");
          break;
        }
        case "investment": {
          const d = investment.data;
          if (!d) { toast.error("Data belum tersedia"); break; }
          const rows = d.properties.map(p => ({
            name: p.name, roi: `${p.roi.toFixed(1)}%`, occupancy: `${p.occupancyRate.toFixed(0)}%`,
            avgRent: formatRupiah(p.avgRent), recommendation: p.recommendation,
          }));
          const html = generateReportHTML(rows as any, [
            { key: "name", label: "Properti" }, { key: "roi", label: "ROI" },
            { key: "occupancy", label: "Okupansi" }, { key: "avgRent", label: "Avg Rent" },
            { key: "recommendation", label: "Rekomendasi" },
          ]);
          if (exportType === "pdf") exportToPDF("Laporan Peluang Investasi", html, "investment_opportunity");
          else exportToExcel(rows as any, "investment_opportunity");
          toast.success("Report berhasil di-generate!");
          break;
        }
      }
    } catch (error) {
      toast.error("Gagal generate report");
    }
    setGenerating(false);
  };

  const handleCustomBuild = async () => {
    if (selectedMetrics.length === 0) { toast.error("Pilih minimal satu metrik"); return; }
    setBuildingCustom(true);

    try {
      const [propertiesRes, unitsRes, maintenanceRes] = await Promise.all([
        db.from("properties").select("id, name, property_type, total_units, occupied_units, construction_cost, renovation_cost").eq("merchant_id", merchantId),
        db.from("units").select("id, property_id, rent_amount, status, unit_type").eq("merchant_id", merchantId),
        db.from("maintenance_requests").select("id, status, created_at").eq("merchant_id", merchantId),
      ]);

      const props = (propertiesRes.data || []) as any[];
      const units = (unitsRes.data || []) as any[];
      const maintenance = (maintenanceRes.data || []) as any[];

      const rows: Record<string, unknown>[] = props.map((p: any) => {
        const propUnits = units.filter((u: any) => u.property_id === p.id);
        const row: Record<string, unknown> = { name: p.name };

        if (selectedMetrics.includes("revenue")) {
          row.revenue = propUnits.reduce((s: number, u: any) => s + ((u.rent_amount || 0) * 12), 0);
        }
        if (selectedMetrics.includes("occupancy")) {
          const total = propUnits.length;
          const occupied = propUnits.filter((u: any) => u.status === "occupied").length;
          row.occupancy = total > 0 ? `${((occupied / total) * 100).toFixed(1)}%` : "0%";
        }
        if (selectedMetrics.includes("roi")) {
          const annRev = propUnits.reduce((s: number, u: any) => s + ((u.rent_amount || 0) * 12), 0);
          const inv = (p.construction_cost || 0) + (p.renovation_cost || 0);
          row.roi = inv > 0 ? `${((annRev / inv) * 100).toFixed(1)}%` : "N/A";
        }
        if (selectedMetrics.includes("risk")) {
          row.riskScore = "N/A";
        }
        if (selectedMetrics.includes("maintenance")) {
          row.maintenance = maintenance.length;
        }
        return row;
      });

      setCustomPreview(rows);
    } catch (error) {
      toast.error("Gagal membangun report");
    }
    setBuildingCustom(false);
  };

  const handleExportCustom = (exportType: "pdf" | "csv") => {
    if (!customPreview || customPreview.length === 0) return;
    const columns = Object.keys(customPreview[0]).map(k => ({ key: k as keyof typeof customPreview[0], label: k.charAt(0).toUpperCase() + k.slice(1) }));
    if (exportType === "pdf") {
      const html = generateReportHTML(customPreview, columns);
      exportToPDF("Custom Report", html, "custom_report");
    } else {
      exportToCSV(customPreview, "custom_report", columns);
    }
  };

  const addReminder = (schedule: string, template: string) => {
    const updated = [...reminders, { schedule, template }];
    setReminders(updated);
    localStorage.setItem("report_reminders", JSON.stringify(updated));
    toast.success(`Reminder ${schedule} untuk ${template} ditambahkan`);
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Template Laporan" description="Generate laporan standar atau buat laporan kustom" />

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="pill-tab-list">
          <TabsTrigger value="templates" className="pill-tab-trigger gap-1.5"><FileText className="h-3.5 w-3.5" /> Template Standar</TabsTrigger>
          <TabsTrigger value="builder" className="pill-tab-trigger gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Report Builder</TabsTrigger>
          <TabsTrigger value="schedule" className="pill-tab-trigger gap-1.5"><Calendar className="h-3.5 w-3.5" /> Jadwal</TabsTrigger>
        </TabsList>

        {/* Tab 1: Standard Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map(tmpl => (
              <Card key={tmpl.type} className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <tmpl.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{tmpl.title}</CardTitle>
                      <CardDescription className="text-xs">{tmpl.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tmpl.needsProperty && (
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                      <SelectContent>
                        {(properties || []).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => handleGenerate(tmpl.type, "pdf")} disabled={generating}>
                      {generating && selectedTemplate === tmpl.type ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} PDF
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => handleGenerate(tmpl.type, "excel")} disabled={generating}>
                      {generating && selectedTemplate === tmpl.type ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Custom Report Builder */}
        <TabsContent value="builder" className="space-y-4">
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
            <CardHeader><CardTitle className="text-base">Report Builder</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Pilih Metrik</Label>
                <div className="flex flex-wrap gap-3">
                  {METRICS.map(m => (
                    <label key={m.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedMetrics.includes(m.key)}
                        onCheckedChange={(checked) => {
                          setSelectedMetrics(prev =>
                            checked ? [...prev, m.key] : prev.filter(k => k !== m.key)
                          );
                        }}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Dimensi</Label>
                <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIMENSIONS.map(d => (
                      <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCustomBuild} disabled={buildingCustom} className="gradient-cta">
                  {buildingCustom ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                  Generate Preview
                </Button>
              </div>

              {customPreview && customPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          {Object.keys(customPreview[0]).map(key => (
                            <th key={key} className="text-left py-2 px-3">{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {customPreview.map((row, i) => (
                          <tr key={i} className="border-b border-border/30">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="py-2 px-3">{String(val ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleExportCustom("pdf")} className="gap-1">
                      <Download className="h-3 w-3" /> Export PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportCustom("csv")} className="gap-1">
                      <Download className="h-3 w-3" /> Export CSV
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Schedule & Limitations */}
        <TabsContent value="schedule" className="space-y-4">
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Jadwal Reminder Report</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/50 border border-border/40 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Automated report generation memerlukan infrastruktur cron job. Saat ini tersedia sebagai reminder manual — Anda akan diingatkan untuk generate report pada jadwal yang ditentukan.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/40 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Email report ke stakeholder memerlukan integrasi email pihak ketiga yang belum tersedia di platform ini.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(t => (
                  <div key={t.type} className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => addReminder("Mingguan", t.title)}>
                      <Calendar className="h-3 w-3 mr-1" /> {t.title} — Mingguan
                    </Button>
                  </div>
                ))}
              </div>

              {reminders.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reminder Aktif</Label>
                  {reminders.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                        <span>{r.template}</span>
                        <Badge variant="secondary" className="text-xs rounded-full">{r.schedule}</Badge>
                      </div>
                      <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => {
                        const updated = reminders.filter((_, idx) => idx !== i);
                        setReminders(updated);
                        localStorage.setItem("report_reminders", JSON.stringify(updated));
                      }}>Hapus</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
