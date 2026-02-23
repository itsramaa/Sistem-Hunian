import { useState } from "react";
import {
  Calculator, Sparkles, Loader2, DollarSign, TrendingUp, BarChart3,
  Shield, AlertTriangle, Wrench, Umbrella, Target,
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
} from "recharts";
import type { FinancialAnalysisResult, RiskAssessmentResult } from "@/features/dss/services/financialRiskService";

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
      <PageHeader icon={Calculator} title="Financial & Risk Analytics" description="Analisis keuangan & penilaian risiko berbasis AI">
        <Badge variant="secondary" className="gap-1 rounded-full">
          <Sparkles className="h-3 w-3" /> AI-Powered
        </Badge>
      </PageHeader>

      {/* Property Selector (required) */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Properti:</span>
        <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); financial.reset(); risk.reset(); }}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Pilih properti" />
          </SelectTrigger>
          <SelectContent>
            {(properties || []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedPropertyId ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Pilih properti terlebih dahulu untuk memulai analisis.</p>
          </CardContent>
        </Card>
      ) : (
        <TierGate feature="ml_financial_analytics" propertyId={selectedPropertyId} merchantId={merchant?.id}>
          <Tabs defaultValue="roi" className="space-y-4">
            <TabsList className="pill-tab-list">
              <TabsTrigger value="roi" className="pill-tab-trigger gap-1.5"><DollarSign className="h-3.5 w-3.5" /> ROI & Payback</TabsTrigger>
              <TabsTrigger value="npv" className="pill-tab-trigger gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> NPV & IRR</TabsTrigger>
              <TabsTrigger value="sensitivity" className="pill-tab-trigger gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Sensitivitas</TabsTrigger>
              <TabsTrigger value="risk" className="pill-tab-trigger gap-1.5"><Shield className="h-3.5 w-3.5" /> Risk Assessment</TabsTrigger>
            </TabsList>

            {/* Tab 1: ROI & Payback */}
            <TabsContent value="roi" className="space-y-4">
              {!finData ? (
                <Card className="rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground mb-4">Hitung ROI, payback period, dan break-even analysis properti ini.</p>
                    <Button onClick={() => financial.mutate({ propertyId: selectedPropertyId })} disabled={financial.isPending} className="gradient-cta">
                      {financial.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Analisis Keuangan
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
                      <Card key={i} className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                        <CardContent className="pt-4 pb-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                          <p className="text-lg font-bold">{kpi.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Break-even */}
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Break-Even Analysis</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                        <div><p className="text-xs text-muted-foreground">Biaya Tetap/Bulan</p><p className="font-semibold">{formatRupiah(finData.break_even.monthly_fixed_costs)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Unit Break-Even</p><p className="font-semibold">{finData.break_even.break_even_units} unit</p></div>
                        <div><p className="text-xs text-muted-foreground">Okupansi Break-Even</p><p className="font-semibold">{(finData.break_even.break_even_occupancy_rate * 100).toFixed(0)}%</p></div>
                        <div><p className="text-xs text-muted-foreground">Revenue/Unit</p><p className="font-semibold">{formatRupiah(finData.break_even.avg_revenue_per_unit)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Biaya Variabel/Unit</p><p className="font-semibold">{formatRupiah(finData.break_even.variable_cost_per_unit)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Waktu Break-Even</p><p className="font-semibold">{finData.break_even.months_to_break_even} bulan</p></div>
                      </div>
                    </CardContent>
                  </Card>

                  {finData.summary && (
                    <Card className="rounded-2xl bg-primary/5 border-primary/20">
                      <CardContent className="py-4"><p className="text-sm">{finData.summary}</p></CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Tab 2: NPV & IRR */}
            <TabsContent value="npv" className="space-y-4">
              {!finData ? (
                <Card className="rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground mb-4">Jalankan analisis keuangan di tab ROI terlebih dahulu.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                      <CardContent className="pt-4 pb-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">NPV</p>
                        <p className="text-lg font-bold">{formatRupiah(finData.npv_irr.npv)}</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                      <CardContent className="pt-4 pb-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">IRR</p>
                        <p className="text-lg font-bold">{finData.npv_irr.irr.toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                      <CardContent className="pt-4 pb-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Discount Rate</p>
                        <p className="text-lg font-bold">{finData.npv_irr.discount_rate_used}%</p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                      <CardContent className="pt-4 pb-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Rekomendasi</p>
                        <Badge variant={finData.npv_irr.recommendation === "invest" ? "default" : finData.npv_irr.recommendation === "divest" ? "destructive" : "secondary"} className="text-sm rounded-full">
                          {finData.npv_irr.recommendation === "invest" ? "✅ Invest" : finData.npv_irr.recommendation === "divest" ? "⛔ Divest" : "⏸ Hold"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {finData.npv_irr.cash_flows.length > 0 && (
                    <>
                      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                        <CardHeader><CardTitle className="text-base">Proyeksi Cash Flow</CardTitle></CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={finData.npv_irr.cash_flows}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                              <XAxis dataKey="year" tickFormatter={(v) => `Th ${v}`} className="text-xs" />
                              <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`} className="text-xs" />
                              <Tooltip formatter={(v: number) => formatRupiah(v)} />
                              <Legend />
                              <Area type="monotone" dataKey="revenue" name="Pendapatan" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                              <Area type="monotone" dataKey="expenses" name="Biaya" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive)/0.1)" />
                              <Area type="monotone" dataKey="net" name="Laba Bersih" stroke="hsl(var(--accent-foreground))" fill="hsl(var(--accent)/0.2)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                        <CardHeader><CardTitle className="text-base">Tabel Cash Flow</CardTitle></CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead><tr className="border-b text-muted-foreground">
                                <th className="text-left py-2 pr-4">Tahun</th>
                                <th className="text-right py-2 px-4">Pendapatan</th>
                                <th className="text-right py-2 px-4">Biaya</th>
                                <th className="text-right py-2 px-4">Laba Bersih</th>
                              </tr></thead>
                              <tbody>
                                {finData.npv_irr.cash_flows.map((cf) => (
                                  <tr key={cf.year} className="border-b border-border/30">
                                    <td className="py-2 pr-4 font-medium">Tahun {cf.year}</td>
                                    <td className="text-right py-2 px-4">{formatRupiah(cf.revenue)}</td>
                                    <td className="text-right py-2 px-4">{formatRupiah(cf.expenses)}</td>
                                    <td className="text-right py-2 px-4 font-semibold">{formatRupiah(cf.net)}</td>
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
                <Card className="rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground mb-4">Jalankan analisis keuangan di tab ROI terlebih dahulu.</p>
                  </CardContent>
                </Card>
              ) : finData.sensitivity.length > 0 ? (
                <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                  <CardHeader><CardTitle className="text-base">Analisis Sensitivitas</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 pr-4">Skenario</th>
                          <th className="text-left py-2 px-4">Variabel</th>
                          <th className="text-right py-2 px-4">Perubahan</th>
                          <th className="text-right py-2 px-4">ROI</th>
                          <th className="text-right py-2 px-4">NPV</th>
                          <th className="text-center py-2 pl-4">Dampak</th>
                        </tr></thead>
                        <tbody>
                          {finData.sensitivity.map((s, i) => (
                            <tr key={i} className="border-b border-border/30">
                              <td className="py-2.5 pr-4 font-medium">{s.scenario_name}</td>
                              <td className="py-2.5 px-4 text-muted-foreground">{s.variable_changed}</td>
                              <td className="text-right py-2.5 px-4">{s.change_percentage > 0 ? "+" : ""}{s.change_percentage}%</td>
                              <td className="text-right py-2.5 px-4">{s.resulting_roi.toFixed(1)}%</td>
                              <td className="text-right py-2.5 px-4">{formatRupiah(s.resulting_npv)}</td>
                              <td className="text-center py-2.5 pl-4">
                                <Badge variant={s.impact_level === "high" ? "destructive" : s.impact_level === "medium" ? "default" : "secondary"} className="text-xs rounded-full">
                                  {s.impact_level}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-2xl"><CardContent className="py-8 text-center text-muted-foreground">Data sensitivitas tidak tersedia.</CardContent></Card>
              )}
            </TabsContent>

            {/* Tab 4: Risk Assessment */}
            <TabsContent value="risk" className="space-y-4">
              {!riskData ? (
                <Card className="rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground mb-4">Analisis risiko bencana, strategi maintenance, dan rekomendasi asuransi.</p>
                    <Button onClick={() => risk.mutate(selectedPropertyId)} disabled={risk.isPending} className="gradient-cta">
                      {risk.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Analisis Risiko
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Risk Score */}
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Disaster Risk Score
                        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${RISK_LEVEL_COLORS[riskData.disaster_risk_score.risk_level] || ""}`}>
                          {riskData.disaster_risk_score.risk_level.toUpperCase()} — {riskData.disaster_risk_score.overall_score}/100
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {riskData.disaster_risk_score.factors.map((f, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium">{f.factor}</span>
                            <span className="text-muted-foreground">{f.score}/100 (bobot: {(f.weight * 100).toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${f.score >= 70 ? "bg-destructive" : f.score >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${f.score}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Preventive Maintenance */}
                  {riskData.preventive_maintenance.length > 0 && (
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" /> Strategi Preventive Maintenance</CardTitle></CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-2">
                        {riskData.preventive_maintenance.map((pm, i) => (
                          <div key={i} className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{pm.strategy}</span>
                              <Badge variant={PRIORITY_COLORS[pm.priority] as any || "secondary"} className="text-xs rounded-full">{pm.priority}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{pm.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>💰 {formatRupiah(pm.estimated_cost)}</span>
                              <span>🔄 {pm.frequency}</span>
                              <span>📉 -{pm.risk_reduction_percentage}% risiko</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Potential Loss */}
                  <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Estimasi Potensi Kerugian</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 grid-cols-2">
                        <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
                          <p className="text-xs text-muted-foreground">Expected Annual Loss</p>
                          <p className="text-lg font-bold text-destructive">{formatRupiah(riskData.potential_loss_estimate.annual_expected_loss)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
                          <p className="text-xs text-muted-foreground">Worst Case Loss</p>
                          <p className="text-lg font-bold text-destructive">{formatRupiah(riskData.potential_loss_estimate.worst_case_loss)}</p>
                        </div>
                      </div>
                      {riskData.potential_loss_estimate.scenarios.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b text-muted-foreground">
                              <th className="text-left py-2 pr-4">Jenis Bencana</th>
                              <th className="text-right py-2 px-4">Probabilitas</th>
                              <th className="text-right py-2 px-4">Kerusakan</th>
                              <th className="text-right py-2 px-4">Revenue Loss</th>
                              <th className="text-right py-2 pl-4">Total</th>
                            </tr></thead>
                            <tbody>
                              {riskData.potential_loss_estimate.scenarios.map((s, i) => (
                                <tr key={i} className="border-b border-border/30">
                                  <td className="py-2.5 pr-4 font-medium">{s.disaster_type}</td>
                                  <td className="text-right py-2.5 px-4">{(s.probability * 100).toFixed(1)}%</td>
                                  <td className="text-right py-2.5 px-4">{formatRupiah(s.estimated_damage_cost)}</td>
                                  <td className="text-right py-2.5 px-4">{s.estimated_revenue_loss_months} bln</td>
                                  <td className="text-right py-2.5 pl-4 font-semibold">{formatRupiah(s.total_potential_loss)}</td>
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
                    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border-border/40">
                      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Umbrella className="h-4 w-4" /> Rekomendasi Asuransi</CardTitle></CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-2">
                        {riskData.insurance_recommendations.map((ins, i) => (
                          <div key={i} className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{ins.coverage_type}</span>
                              <div className="flex items-center gap-1.5">
                                {ins.gap_identified && <Badge variant="destructive" className="text-xs rounded-full">Gap</Badge>}
                                <Badge variant={PRIORITY_COLORS[ins.priority] as any || "secondary"} className="text-xs rounded-full">{ins.priority}</Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{ins.reason}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Coverage: {formatRupiah(ins.recommended_coverage_amount)}</span>
                              <span>Premi: {formatRupiah(ins.estimated_premium)}/th</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {riskData.summary && (
                    <Card className="rounded-2xl bg-primary/5 border-primary/20">
                      <CardContent className="py-4"><p className="text-sm">{riskData.summary}</p></CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </TierGate>
      )}
    </div>
  );
}
