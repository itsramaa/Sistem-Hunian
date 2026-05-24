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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  { type: "executive", icon: BarChart3, title: "Ringkasan Eksekutif", description: "KPI utama: pendapatan, hunian, risiko, dan ROI", needsProperty: false },
  { type: "property", icon: FileText, title: "Analisis Properti Detail", description: "Rincian unit, kontrak, dan pemeliharaan per properti", needsProperty: true },
  { type: "financial", icon: DollarSign, title: "Kinerja Keuangan", description: "Laba Rugi (P&L), ROI, dan analisis investasi properti", needsProperty: false },
  { type: "risk", icon: Shield, title: "Penilaian Risiko", description: "Evaluasi risiko bencana, penyewa, dan kepatuhan", needsProperty: false },
  { type: "investment", icon: TrendingUp, title: "Peluang Investasi", description: "Peringkat ROI dan rekomendasi pengembangan aset", needsProperty: false },
];

const METRICS = [
  { key: "revenue", label: "Pendapatan" },
  { key: "occupancy", label: "Tingkat Hunian" },
  { key: "roi", label: "ROI (Balik Modal)" },
  { key: "risk", label: "Skor Risiko" },
  { key: "maintenance", label: "Pemeliharaan" },
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
      // TODO: Go endpoint not yet implemented — was: supabase.from('merchants').select('id').eq('user_id', user.id).single()
      return null;
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
             { metric: "Tingkat Hunian", value: `${d.occupancyRate.toFixed(1)}%` },
             { metric: "Total Pendapatan", value: formatRupiah(d.totalRevenue) },
             { metric: "Pemeliharaan Tertunda", value: String(d.pendingMaintenance) },
             { metric: "Rata-rata Skor Risiko", value: d.avgRiskScore.toFixed(1) }] as any,
            [{ key: "metric", label: "Metrik" }, { key: "value", label: "Nilai" }]
          );
          if (exportType === "pdf") {
            exportToPDF("Laporan Ringkasan Eksekutif", html, "executive_summary");
          } else {
            exportToExcel(
              [{ metric: "Total Properti", value: d.totalProperties },
               { metric: "Total Unit", value: d.totalUnits },
               { metric: "Tingkat Hunian", value: `${d.occupancyRate.toFixed(1)}%` },
               { metric: "Total Pendapatan", value: d.totalRevenue },
               { metric: "Pemeliharaan Tertunda", value: d.pendingMaintenance }] as any,
              "executive_summary",
              [{ key: "metric", label: "Metrik" }, { key: "value", label: "Nilai" }]
            );
          }
          toast.success("Laporan berhasil dibuat!");
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
            { label: "Total Pemeliharaan", value: String(d.maintenanceRequests.total) },
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
          toast.success("Laporan berhasil dibuat!");
          break;
        }
        case "financial": {
          const d = financial.data;
          if (!d) { toast.error("Data belum tersedia"); break; }
          const rows = d.properties.map(p => ({
            name: p.name, revenue: formatRupiah(p.revenue), roi: `${p.roi.toFixed(1)}%`,
          }));
          const summary = [
            { label: "Total Pendapatan", value: formatRupiah(d.totalRevenue) },
            { label: "Total Pengeluaran", value: formatRupiah(d.totalExpenses) },
            { label: "Pendapatan Bersih", value: formatRupiah(d.totalNetIncome) },
          ];
          const html = generateReportHTML(rows as any, [
            { key: "name", label: "Properti" }, { key: "revenue", label: "Pendapatan" }, { key: "roi", label: "ROI" },
          ], summary);
          if (exportType === "pdf") exportToPDF("Laporan Kinerja Keuangan", html, "financial_performance");
          else exportToExcel(rows as any, "financial_performance", [
            { key: "name", label: "Properti" }, { key: "revenue", label: "Pendapatan" }, { key: "roi", label: "ROI" },
          ]);
          toast.success("Laporan berhasil dibuat!");
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
          toast.success("Laporan berhasil dibuat!");
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
            { key: "occupancy", label: "Tingkat Hunian" }, { key: "avgRent", label: "Rata-rata Sewa" },
            { key: "recommendation", label: "Rekomendasi" },
          ]);
          if (exportType === "pdf") exportToPDF("Laporan Peluang Investasi", html, "investment_opportunity");
          else exportToExcel(rows as any, "investment_opportunity");
          toast.success("Laporan berhasil dibuat!");
          break;
        }
      }
    } catch (error) {
      toast.error("Gagal membuat laporan");
    }
    setGenerating(false);
  };

  const handleCustomBuild = async () => {
    if (selectedMetrics.length === 0) { toast.error("Pilih minimal satu metrik"); return; }
    setBuildingCustom(true);

    try {
      // TODO: Go endpoint not yet implemented — was: db.from('properties'), db.from('units'), db.from('maintenance_requests')
      const props: any[] = [];
      const units: any[] = [];
      const maintenance: any[] = [];

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
      toast.error("Gagal membangun laporan");
    }
    setBuildingCustom(false);
  };

  const handleExportCustom = (exportType: "pdf" | "csv") => {
    if (!customPreview || customPreview.length === 0) return;
    const columns = Object.keys(customPreview[0]).map(k => ({ key: k as keyof typeof customPreview[0], label: k.charAt(0).toUpperCase() + k.slice(1) }));
    if (exportType === "pdf") {
      const html = generateReportHTML(customPreview, columns);
      exportToPDF("Laporan Kustom", html, "custom_report");
    } else {
      exportToCSV(customPreview, "custom_report", columns);
    }
  };

  const addReminder = (schedule: string, template: string) => {
    const updated = [...reminders, { schedule, template }];
    setReminders(updated);
    localStorage.setItem("report_reminders", JSON.stringify(updated));
    toast.success(`Pengingat ${schedule} untuk ${template} ditambahkan`);
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Laporan" description="Hasilkan laporan standar atau buat laporan kustom untuk bisnis Anda" />

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="pill-tab-list" aria-label="Menu pelaporan">
          <TabsTrigger value="templates" className="pill-tab-trigger gap-1.5"><FileText className="h-3.5 w-3.5" aria-hidden="true" /> Template Standar</TabsTrigger>
          <TabsTrigger value="builder" className="pill-tab-trigger gap-1.5"><BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Pembuat Laporan</TabsTrigger>
          <TabsTrigger value="schedule" className="pill-tab-trigger gap-1.5"><Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Jadwal Pengingat</TabsTrigger>
        </TabsList>

        {/* Tab 1: Standard Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map(tmpl => (
              <Card key={tmpl.type} className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10" aria-hidden="true">
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
                    <div className="space-y-1.5">
                      <Label htmlFor={`prop-select-${tmpl.type}`} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Pilih Properti</Label>
                      <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                        <SelectTrigger id={`prop-select-${tmpl.type}`} className="h-8 text-xs rounded-lg bg-background/50" aria-label="Pilih properti untuk laporan">
                          <SelectValue placeholder="Pilih properti" />
                        </SelectTrigger>
                        <SelectContent>
                          {(properties || []).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1.5 rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary" onClick={() => handleGenerate(tmpl.type, "pdf")} disabled={generating}>
                      {generating && selectedTemplate === tmpl.type ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Download className="h-3 w-3" aria-hidden="true" />} PDF
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1.5 rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary" onClick={() => handleGenerate(tmpl.type, "excel")} disabled={generating}>
                      {generating && selectedTemplate === tmpl.type ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : <Download className="h-3 w-3" aria-hidden="true" />} Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Custom Report Builder */}
        <TabsContent value="builder" className="space-y-4">
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40"><CardTitle className="text-base">Pembuat Laporan Kustom</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold mb-2 block">1. Pilih Metrik Utama</Label>
                <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                  {METRICS.map(m => (
                    <label key={m.key} className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-primary transition-colors">
                      <Checkbox
                        checked={selectedMetrics.includes(m.key)}
                        onCheckedChange={(checked) => {
                          setSelectedMetrics(prev =>
                            checked ? [...prev, m.key] : prev.filter(k => k !== m.key)
                          );
                        }}
                        className="rounded-md"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="dimension-select" className="text-sm font-semibold mb-2 block">2. Pilih Dimensi Data</Label>
                <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                  <SelectTrigger id="dimension-select" className="w-full sm:w-64 rounded-xl bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIMENSIONS.map(d => (
                      <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button onClick={handleCustomBuild} disabled={buildingCustom} className="gradient-cta rounded-xl shadow-sm">
                  {buildingCustom ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />}
                  Tampilkan Pratinjau
                </Button>
              </div>

              {customPreview && customPreview.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/30 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pratinjau Laporan</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleExportCustom("pdf")} className="gap-1.5 rounded-lg text-xs border-primary/30 hover:bg-primary/5 hover:text-primary">
                        <Download className="h-3 w-3" aria-hidden="true" /> Ekspor PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleExportCustom("csv")} className="gap-1.5 rounded-lg text-xs border-primary/30 hover:bg-primary/5 hover:text-primary">
                        <Download className="h-3 w-3" aria-hidden="true" /> Ekspor CSV
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border/40">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border/40">
                        <tr>
                          {Object.keys(customPreview[0]).map(key => (
                            <th key={key} className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-wider">
                              {key === 'name' ? 'Nama' : 
                               key === 'revenue' ? 'Pendapatan' : 
                               key === 'occupancy' ? 'Okupansi' : 
                               key === 'roi' ? 'ROI' : 
                               key === 'riskScore' ? 'Skor Risiko' : 
                               key === 'maintenance' ? 'Pemeliharaan' : key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 bg-card/40">
                        {customPreview.map((row, i) => (
                          <tr key={i} className="hover:bg-primary/5 transition-colors">
                            {Object.entries(row).map(([key, val], j) => (
                              <td key={j} className="py-3 px-4 font-medium text-xs">
                                {key === 'revenue' ? formatRupiah(Number(val)) : String(val ?? "-")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Schedule & Limitations */}
        <TabsContent value="schedule" className="space-y-4">
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden="true" /> Jadwal Pengingat Laporan</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-background shadow-sm" aria-hidden="true">
                    <AlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-tight">Catatan Sistem</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Laporan otomatis memerlukan infrastruktur terjadwal. Saat ini tersedia sebagai pengingat manual di dashboard Anda.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-background shadow-sm" aria-hidden="true">
                    <AlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-tight">Pengiriman Email</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Fitur kirim laporan otomatis ke email pemangku kepentingan akan tersedia pada pembaruan mendatang.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Tambah Pengingat Mingguan</Label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map(t => (
                    <Button key={t.type} size="sm" variant="outline" className="text-xs rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary gap-1.5" onClick={() => addReminder("Mingguan", t.title)}>
                      <Calendar className="h-3 w-3" aria-hidden="true" /> {t.title}
                    </Button>
                  ))}
                </div>
              </div>

              {reminders.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/30">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" aria-hidden="true" /> Pengingat Aktif
                  </Label>
                  <div className="grid gap-2">
                    {reminders.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card/60 border border-border/30 group hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{r.template}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{r.schedule}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs h-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => {
                          const updated = reminders.filter((_, idx) => idx !== i);
                          setReminders(updated);
                          localStorage.setItem("report_reminders", JSON.stringify(updated));
                        }}>Hapus</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
