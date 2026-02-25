import { useState } from "react";
import {
  Calculator, Sparkles, Loader2, DollarSign, TrendingUp, BarChart3,
  Shield, AlertTriangle, Wrench, Umbrella, Target, Users,
} from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { TierGate } from "@/features/dss/components/TierGate";
import { useFinancialAnalytics, useRiskAssessment } from "@/features/dss/hooks/useFinancialRisk";
import { useMerchantProperties } from "@/features/properties/hooks/useMerchantProperties";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";
import { formatRupiah } from "@/shared/utils/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import type { FinancialAnalysisResult, RiskAssessmentResult } from "@/features/dss/services/financialRiskService";
import { Label } from "@/shared/components/ui/label";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  low: "text-green-600 bg-green-100 dark:bg-green-900/30",
  medium: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
  high: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  critical: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

export default function FinancialRiskAnalytics() {
  const { user } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const { data: merchant } = useQuery({
    queryKey: ["merchant-for-fra", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("merchants").select("id").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { properties } = useMerchantProperties(merchant?.id || "");

  const financial = useFinancialAnalytics();
  const risk = useRiskAssessment();

  const finData = financial.data?.analysis as FinancialAnalysisResult | undefined;
  const riskData = risk.data?.assessment as RiskAssessmentResult | undefined;

  return (
    <div className="space-y-6">
      <PageHeader icon={Calculator} title="Analitik Keuangan & Risiko" description="Analisis keuangan & penilaian risiko berbasis AI">
        <Badge variant="secondary" className="gap-1 rounded-full bg-primary/10 text-primary border-primary/20">
          <Sparkles className="h-3 w-3" aria-hidden="true" /> Didukung AI
        </Badge>
      </PageHeader>

      {/* Property Selector (required) */}
      <div className="flex items-center gap-3">
        <Label htmlFor="property_selector" className="text-sm font-medium text-muted-foreground">Properti:</Label>
        <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); financial.reset(); risk.reset(); }}>
          <SelectTrigger id="property_selector" className="w-[260px] rounded-xl bg-card/80 backdrop-blur-sm border-border/40">
            <SelectValue placeholder="Pilih properti" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 bg-popover/95 backdrop-blur-xl">
            {(properties || []).map((p) => (
              <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedPropertyId ? (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4" aria-hidden="true">
              <Calculator className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">Pilih properti terlebih dahulu untuk memulai analisis.</p>
          </CardContent>
        </Card>
      ) : (
        <TierGate feature="ml_financial_analytics" propertyId={selectedPropertyId} merchantId={merchant?.id}>
          <Tabs defaultValue="roi" className="space-y-4">
            <TabsList className="pill-tab-list">
              <TabsTrigger value="roi" className="pill-tab-trigger gap-1.5"><DollarSign className="h-3.5 w-3.5" /> ROI & Payback</TabsTrigger>
              <TabsTrigger value="npv" className="pill-tab-trigger gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> NPV & IRR</TabsTrigger>
              <TabsTrigger value="sensitivity" className="pill-tab-trigger gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Sensitivitas</TabsTrigger>
              <TabsTrigger value="risk" className="pill-tab-trigger gap-1.5"><Shield className="h-3.5 w-3.5" /> Penilaian Risiko</TabsTrigger>
              <TabsTrigger value="benchmark" className="pill-tab-trigger gap-1.5"><Users className="h-3.5 w-3.5" /> Benchmark</TabsTrigger>
            </TabsList>

            {/* Tab 1: ROI & Payback */}
            <TabsContent value="roi" className="space-y-4">
              {!finData ? (
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                      <DollarSign className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-4">Hitung ROI, payback period, dan break-even analysis properti ini.</p>
                    <Button onClick={() => financial.mutate({ propertyId: selectedPropertyId })} disabled={financial.isPending} className="gradient-cta rounded-xl shadow-md">
                      {financial.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Mulai Analisis Keuangan
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                    {[
                      { label: "Total Investasi", value: formatRupiah(finData.roi_analysis.total_investment) },
                      { label: "Pendapatan Tahunan", value: formatRupiah(finData.roi_analysis.annual_revenue) },
                      { label: "Biaya Tahunan", value: formatRupiah(finData.roi_analysis.annual_expenses) },
                      { label: "Laba Bersih Tahunan", value: formatRupiah(finData.roi_analysis.net_annual_income) },
                      { label: "ROI", value: `${finData.roi_analysis.roi_percentage.toFixed(1)}%` },
                      { label: "Payback Period", value: `${finData.roi_analysis.payback_period_years.toFixed(1)} tahun` },
                    ].map((kpi, i) => (
                      <Card key={i} className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm hover:border-primary/20 transition-colors">
                        <CardContent className="pt-5 pb-4 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{kpi.label}</p>
                          <p className="text-xl font-bold text-primary">{kpi.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Break-even */}
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-border/40"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" aria-hidden="true" /> Analisis Break-Even</CardTitle></CardHeader>
                    <CardContent className="p-6">
                      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40"><p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Biaya Tetap/Bulan</p><p className="font-bold text-sm">{formatRupiah(finData.break_even.monthly_fixed_costs)}</p></div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40"><p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Unit Break-Even</p><p className="font-bold text-sm">{finData.break_even.break_even_units} unit</p></div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40"><p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Okupansi Break-Even</p><p className="font-bold text-sm">{(finData.break_even.break_even_occupancy_rate * 100).toFixed(0)}%</p></div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40"><p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Revenue/Unit</p><p className="font-bold text-sm">{formatRupiah(finData.break_even.avg_revenue_per_unit)}</p></div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40"><p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Biaya Variabel/Unit</p><p className="font-bold text-sm">{formatRupiah(finData.break_even.variable_cost_per_unit)}</p></div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40"><p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Waktu Break-Even</p><p className="font-bold text-sm">{finData.break_even.months_to_break_even} bulan</p></div>
                      </div>
                    </CardContent>
                  </Card>

                  {finData.summary && (
                    <Card className="rounded-2xl bg-primary/5 border-primary/20 shadow-sm">
                      <CardContent className="py-4 flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5" aria-hidden="true">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <p className="text-sm leading-relaxed">{finData.summary}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Tab 2: NPV & IRR */}
            <TabsContent value="npv" className="space-y-4">
              {!finData ? (
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4" aria-hidden="true">
                      <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground mb-4">Jalankan analisis keuangan di tab ROI terlebih dahulu.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
                      <CardContent className="pt-4 pb-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">NPV</p>
                        <p className="text-lg font-bold text-primary">{formatRupiah(finData.npv_irr.npv)}</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
                      <CardContent className="pt-4 pb-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">IRR</p>
                        <p className="text-lg font-bold text-primary">{finData.npv_irr.irr.toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
                      <CardContent className="pt-4 pb-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Discount Rate</p>
                        <p className="text-lg font-bold">{finData.npv_irr.discount_rate_used}%</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
                      <CardContent className="pt-4 pb-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Rekomendasi</p>
                        <Badge variant={finData.npv_irr.recommendation === "invest" ? "default" : finData.npv_irr.recommendation === "divest" ? "destructive" : "secondary"} className="text-xs rounded-full">
                          {finData.npv_irr.recommendation === "invest" ? "✅ Investasi" : finData.npv_irr.recommendation === "divest" ? "⛔ Divestasi" : "⏸ Hold"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {finData.npv_irr.cash_flows.length > 0 && (
                    <>
                      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/20 border-b border-border/40"><CardTitle className="text-base">Proyeksi Arus Kas (Cash Flow)</CardTitle></CardHeader>
                        <CardContent className="p-6">
                          <div className="h-[300px] w-full" role="img" aria-label="Grafik Proyeksi Arus Kas">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={finData.npv_irr.cash_flows}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                                <XAxis dataKey="year" tickFormatter={(v) => `Th ${v}`} className="text-[10px]" />
                                <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`} className="text-[10px]" />
                                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="Pendapatan" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                                <Area type="monotone" dataKey="expenses" name="Biaya" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive)/0.1)" />
                                <Area type="monotone" dataKey="net" name="Laba Bersih" stroke="hsl(var(--accent-foreground))" fill="hsl(var(--accent)/0.2)" strokeWidth={2} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/20 border-b border-border/40"><CardTitle className="text-base">Tabel Arus Kas</CardTitle></CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead><tr className="bg-muted/30 border-b text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                <th className="text-left py-3 px-4">Tahun</th>
                                <th className="text-right py-3 px-4">Pendapatan</th>
                                <th className="text-right py-3 px-4">Biaya</th>
                                <th className="text-right py-3 px-4">Laba Bersih</th>
                              </tr></thead>
                              <tbody>
                                {finData.npv_irr.cash_flows.map((cf) => (
                                  <tr key={cf.year} className="border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors">
                                    <td className="py-3 px-4 font-medium">Tahun {cf.year}</td>
                                    <td className="text-right py-3 px-4 text-muted-foreground">{formatRupiah(cf.revenue)}</td>
                                    <td className="text-right py-3 px-4 text-muted-foreground">{formatRupiah(cf.expenses)}</td>
                                    <td className="text-right py-3 px-4 font-bold text-primary">{formatRupiah(cf.net)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </>
              )}
            </TabsContent>

            {/* Tab 3: Sensitivity */}
            <TabsContent value="sensitivity" className="space-y-4">
              {!finData ? (
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4" aria-hidden="true">
                      <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground mb-4">Jalankan analisis keuangan di tab ROI terlebih dahulu.</p>
                  </CardContent>
                </Card>
              ) : finData.sensitivity.length > 0 ? (
                <>
                  {/* Sensitivity Chart */}
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-border/40"><CardTitle className="text-base">Grafik Sensitivitas ROI</CardTitle></CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px] w-full" role="img" aria-label="Grafik Sensitivitas ROI">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={finData.sensitivity}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                            <XAxis dataKey="scenario_name" className="text-[10px]" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                            <YAxis tickFormatter={(v) => `${v}%`} className="text-[10px]" />
                            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                            <Legend />
                            <ReferenceLine y={finData.roi_analysis.roi_percentage} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: `Baseline: ${finData.roi_analysis.roi_percentage.toFixed(1)}%`, position: "top", fontSize: 10, fill: "hsl(var(--primary))" }} />
                            <Bar dataKey="resulting_roi" name="ROI Skenario" fill="hsl(var(--primary))"
                              shape={(props: any) => {
                                const { x, y, width, height, payload } = props;
                                const color = payload.impact_level === "high" ? "hsl(var(--destructive))" : payload.impact_level === "medium" ? "hsl(45 93% 47%)" : "hsl(142 76% 36%)";
                                return <rect x={x} y={y} width={width} height={height} fill={color} rx={4} />;
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sensitivity Table */}
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-border/40"><CardTitle className="text-base">Tabel Analisis Sensitivitas</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-muted/30 border-b text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            <th className="text-left py-3 px-4">Skenario</th>
                            <th className="text-left py-3 px-4">Variabel</th>
                            <th className="text-right py-3 px-4">Perubahan</th>
                            <th className="text-right py-3 px-4">ROI</th>
                            <th className="text-right py-3 px-4">NPV</th>
                            <th className="text-center py-3 px-4">Dampak</th>
                          </tr></thead>
                          <tbody>
                            {finData.sensitivity.map((s, i) => (
                              <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors">
                                <td className="py-3 px-4 font-medium">{s.scenario_name}</td>
                                <td className="py-3 px-4 text-muted-foreground">{s.variable_changed}</td>
                                <td className="text-right py-3 px-4 font-mono">{s.change_percentage > 0 ? "+" : ""}{s.change_percentage}%</td>
                                <td className="text-right py-3 px-4 font-bold">{s.resulting_roi.toFixed(1)}%</td>
                                <td className="text-right py-3 px-4 text-muted-foreground">{formatRupiah(s.resulting_npv)}</td>
                                <td className="text-center py-3 px-4">
                                  <Badge variant={s.impact_level === "high" ? "destructive" : s.impact_level === "medium" ? "default" : "secondary"} className="text-[10px] rounded-full px-2">
                                    {s.impact_level === "high" ? "Tinggi" : s.impact_level === "medium" ? "Sedang" : "Rendah"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">Data sensitivitas tidak tersedia.</CardContent></Card>
              )}
            </TabsContent>

            {/* Tab 4: Risk Assessment */}
            <TabsContent value="risk" className="space-y-4">
              {!riskData ? (
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-4">Analisis risiko bencana, strategi pemeliharaan, dan rekomendasi asuransi.</p>
                    <Button onClick={() => risk.mutate(selectedPropertyId)} disabled={risk.isPending} className="gradient-cta rounded-xl shadow-md">
                      {risk.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Mulai Analisis Risiko
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Risk Score */}
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-border/40">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" /> Skor Risiko Bencana
                        <span className={`ml-auto px-3 py-1 rounded-full text-[10px] font-bold border ${RISK_LEVEL_COLORS[riskData.disaster_risk_score.risk_level] || ""}`}>
                          {riskData.disaster_risk_score.risk_level.toUpperCase()} — {riskData.disaster_risk_score.overall_score}/100
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                      {riskData.disaster_risk_score.factors.map((f, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-bold">{f.factor}</span>
                            <span className="text-xs text-muted-foreground font-mono">{f.score}/100 (bobot: {(f.weight * 100).toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={f.score} aria-valuemin={0} aria-valuemax={100}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${f.score >= 70 ? "bg-destructive" : f.score >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${f.score}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed italic">{f.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Preventive Maintenance */}
                  {riskData.preventive_maintenance.length > 0 && (
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
                      <CardHeader className="bg-muted/20 border-b border-border/40"><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" aria-hidden="true" /> Strategi Pemeliharaan Preventif</CardTitle></CardHeader>
                      <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
                        {riskData.preventive_maintenance.map((pm, i) => (
                          <div key={i} className="p-4 rounded-2xl border border-border/40 bg-muted/20 space-y-2.5 hover:border-primary/30 transition-colors shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">{pm.strategy}</span>
                              <Badge variant={PRIORITY_COLORS[pm.priority] as any || "secondary"} className="text-[10px] rounded-full px-2">
                                {pm.priority === "critical" ? "Kritis" : pm.priority === "high" ? "Tinggi" : pm.priority === "medium" ? "Sedang" : "Rendah"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{pm.description}</p>
                            <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {formatRupiah(pm.estimated_cost)}</span>
                              <span className="flex items-center gap-1">🔄 {pm.frequency === "annual" ? "Tahunan" : pm.frequency === "quarterly" ? "Kuartal" : pm.frequency === "monthly" ? "Bulanan" : pm.frequency}</span>
                              <span className="flex items-center gap-1 text-success">📉 -{pm.risk_reduction_percentage}% risiko</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Potential Loss */}
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-border/40"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" /> Estimasi Potensi Kerugian</CardTitle></CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid gap-4 grid-cols-2">
                        <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-center shadow-sm">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Ekspektasi Kerugian Tahunan</p>
                          <p className="text-xl font-bold text-destructive">{formatRupiah(riskData.potential_loss_estimate.annual_expected_loss)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-center shadow-sm">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Kerugian Terburuk (Worst Case)</p>
                          <p className="text-xl font-bold text-destructive">{formatRupiah(riskData.potential_loss_estimate.worst_case_loss)}</p>
                        </div>
                      </div>
                      {riskData.potential_loss_estimate.scenarios.length > 0 && (
                        <div className="overflow-x-auto rounded-xl border border-border/40">
                          <table className="w-full text-sm">
                            <thead><tr className="bg-muted/30 border-b text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                              <th className="text-left py-3 px-4">Jenis Bencana</th>
                              <th className="text-right py-3 px-4">Probabilitas</th>
                              <th className="text-right py-3 px-4">Biaya Kerusakan</th>
                              <th className="text-right py-3 px-4">Kehilangan Pendapatan</th>
                              <th className="text-right py-3 px-4">Total</th>
                            </tr></thead>
                            <tbody>
                              {riskData.potential_loss_estimate.scenarios.map((s, i) => (
                                <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-destructive/5 transition-colors">
                                  <td className="py-3 px-4 font-bold">{s.disaster_type}</td>
                                  <td className="text-right py-3 px-4 font-mono">{(s.probability * 100).toFixed(1)}%</td>
                                  <td className="text-right py-3 px-4 text-muted-foreground">{formatRupiah(s.estimated_damage_cost)}</td>
                                  <td className="text-right py-3 px-4 text-muted-foreground">{s.estimated_revenue_loss_months} bln</td>
                                  <td className="text-right py-3 px-4 font-bold text-destructive">{formatRupiah(s.total_potential_loss)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Insurance Recommendations */}
                  {riskData.insurance_recommendations.length > 0 && (
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
                      <CardHeader className="bg-muted/20 border-b border-border/40"><CardTitle className="text-base flex items-center gap-2"><Umbrella className="h-4 w-4 text-accent-foreground" aria-hidden="true" /> Rekomendasi Asuransi</CardTitle></CardHeader>
                      <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
                        {riskData.insurance_recommendations.map((ins, i) => (
                          <div key={i} className="p-4 rounded-2xl border border-border/40 bg-muted/20 space-y-2.5 hover:border-primary/30 transition-colors shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">{ins.coverage_type}</span>
                              <div className="flex items-center gap-1.5">
                                {ins.gap_identified && <Badge variant="destructive" className="text-[10px] rounded-full px-2">Celah Perlindungan</Badge>}
                                <Badge variant={PRIORITY_COLORS[ins.priority] as any || "secondary"} className="text-[10px] rounded-full px-2">
                                  {ins.priority === "critical" ? "Kritis" : ins.priority === "high" ? "Tinggi" : ins.priority === "medium" ? "Sedang" : "Rendah"}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{ins.reason}</p>
                            <div className="flex items-center gap-4 pt-1 text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">🛡️ Perlindungan: {formatRupiah(ins.recommended_coverage_amount)}</span>
                              <span className="flex items-center gap-1">💳 Premi: {formatRupiah(ins.estimated_premium)}/th</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {riskData.summary && (
                    <Card className="rounded-2xl bg-primary/5 border-primary/20 shadow-sm">
                      <CardContent className="py-4 flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5" aria-hidden="true">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <p className="text-sm leading-relaxed">{riskData.summary}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Tab 5: Benchmark */}
            <TabsContent value="benchmark" className="space-y-4">
              <BenchmarkTab selectedPropertyId={selectedPropertyId} merchantId={merchant?.id || ""} properties={properties || []} />
            </TabsContent>
          </Tabs>
        </TierGate>
      )}
    </div>
  );
}

// Benchmark Tab Component
function BenchmarkTab({ selectedPropertyId, merchantId, properties }: { selectedPropertyId: string; merchantId: string; properties: any[] }) {
  const db = supabase as any;
  const { data: benchmarkData } = useQuery({
    queryKey: ["benchmark", merchantId, selectedPropertyId],
    queryFn: async () => {
      const [unitsRes] = await Promise.all([
        db.from("units").select("id, property_id, rent_amount, status").eq("merchant_id", merchantId),
      ]);
      const units = (unitsRes.data || []) as any[];
      const selectedProp = properties.find((p: any) => p.id === selectedPropertyId);
      if (!selectedProp) return null;

      const peerProps = properties.filter((p: any) => p.id !== selectedPropertyId && (p.city === selectedProp.city || p.property_type === selectedProp.property_type));

      const calcMetrics = (propId: string) => {
        const propUnits = units.filter((u: any) => u.property_id === propId);
        const total = propUnits.length;
        const occupied = propUnits.filter((u: any) => u.status === "occupied").length;
        const avgRent = total > 0 ? propUnits.reduce((s: number, u: any) => s + (u.rent_amount || 0), 0) / total : 0;
        const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
        return { totalUnits: total, occupancyRate, avgRent };
      };

      const myMetrics = calcMetrics(selectedPropertyId);
      const peerMetricsList = peerProps.map((p: any) => calcMetrics(p.id));

      const avgPeer = peerMetricsList.length > 0 ? {
        occupancyRate: peerMetricsList.reduce((s, m) => s + m.occupancyRate, 0) / peerMetricsList.length,
        avgRent: peerMetricsList.reduce((s, m) => s + m.avgRent, 0) / peerMetricsList.length,
        totalUnits: peerMetricsList.reduce((s, m) => s + m.totalUnits, 0) / peerMetricsList.length,
      } : { occupancyRate: 0, avgRent: 0, totalUnits: 0 };

      return {
        my: myMetrics,
        peer: avgPeer,
        peerCount: peerProps.length,
        propertyName: selectedProp.name,
        radarData: [
          { subject: "Okupansi", mine: myMetrics.occupancyRate, peer: avgPeer.occupancyRate, fullMark: 100 },
          { subject: "Avg Rent (x1000)", mine: myMetrics.avgRent / 1000, peer: avgPeer.avgRent / 1000, fullMark: Math.max(myMetrics.avgRent, avgPeer.avgRent) / 1000 * 1.2 || 100 },
          { subject: "Total Unit", mine: myMetrics.totalUnits, peer: avgPeer.totalUnits, fullMark: Math.max(myMetrics.totalUnits, avgPeer.totalUnits) * 1.2 || 10 },
        ],
      };
    },
    enabled: !!merchantId && !!selectedPropertyId && properties.length > 0,
  });

  if (!benchmarkData) {
    return (
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4" aria-hidden="true">
            <Users className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground">Memuat data benchmark peer group...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-primary/20 shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Okupansi Anda</p>
            <p className="text-xl font-bold text-primary">{benchmarkData.my.occupancyRate.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Rata-rata Peer ({benchmarkData.peerCount})</p>
            <p className="text-xl font-bold">{benchmarkData.peer.occupancyRate.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Avg Rent Anda</p>
            <p className="text-xl font-bold">{formatRupiah(benchmarkData.my.avgRent)}</p>
          </CardContent>
        </Card>
      </div>

      {benchmarkData.peerCount > 0 ? (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/40"><CardTitle className="text-base">Perbandingan Radar — "{benchmarkData.propertyName}" vs Peer Group</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full" role="img" aria-label="Grafik Radar Perbandingan Peer Group">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={benchmarkData.radarData}>
                  <PolarGrid className="stroke-border/30" />
                  <PolarAngleAxis dataKey="subject" className="text-[10px]" />
                  <PolarRadiusAxis className="text-[10px]" />
                  <Radar name="Properti Anda" dataKey="mine" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Radar name="Rata-rata Peer" dataKey="peer" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.15} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40 shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <Users className="h-6 w-6 opacity-50" />
            </div>
            <p className="font-medium">Tidak ada peer group ditemukan</p>
            <p className="text-xs mt-1">(properti lain di kota/segmen yang sama).</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Duplicate BenchmarkTab removed
