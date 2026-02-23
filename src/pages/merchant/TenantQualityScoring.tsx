import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMerchantTier } from "@/features/dss/hooks/useMerchantTier";
import { useTenantQualityScoring } from "@/features/dss/hooks/useTenantQuality";
import {
  TenantQualityResult,
  BatchTenantResult,
  ScreeningData,
} from "@/features/dss/services/tenantQualityService";
import { TierGatedFeature } from "@/shared/components/dss/TierGatedFeature";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Progress } from "@/shared/components/ui/progress";
import { supabase } from "@/lib/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  UserCheck,
  Loader2,
  Sparkles,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Users,
} from "lucide-react";
import { formatRupiah } from "@/shared/utils/utils";

const GRADE_COLORS: Record<string, string> = {
  A: "bg-success/15 text-success border-success/30",
  B: "bg-info/15 text-info border-info/30",
  C: "bg-warning/15 text-warning border-warning/30",
  D: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  F: "bg-destructive/15 text-destructive border-destructive/30",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-orange-500/15 text-orange-600",
  critical: "bg-destructive/15 text-destructive",
};

const DECISION_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  approve: { color: "bg-success/15 text-success", icon: CheckCircle2 },
  approve_with_conditions: { color: "bg-warning/15 text-warning", icon: AlertTriangle },
  review: { color: "bg-info/15 text-info", icon: Shield },
  reject: { color: "bg-destructive/15 text-destructive", icon: XCircle },
};

export default function TenantQualityScoring() {
  const { merchant } = useAuth();
  const { tierName: currentTier } = useMerchantTier();
  const scoring = useTenantQualityScoring();

  const [mode, setMode] = useState<"existing" | "screening">("existing");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [result, setResult] = useState<TenantQualityResult | null>(null);
  const [batchResults, setBatchResults] = useState<BatchTenantResult[] | null>(null);
  const [screeningForm, setScreeningForm] = useState<ScreeningData>({
    name: "", occupation: "", monthly_income: 0, previous_rental_history: "", references: "",
  });

  // Fetch active tenants
  const { data: tenants } = useQuery({
    queryKey: ["merchant-active-tenants", merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data } = await supabase
        .from("contracts")
        .select("tenant_user_id, profiles:tenant_user_id(full_name, email)")
        .eq("merchant_id", merchant.id)
        .eq("status", "active");
      const unique = new Map<string, { id: string; name: string; email: string }>();
      (data || []).forEach((c: any) => {
        if (!unique.has(c.tenant_user_id)) {
          unique.set(c.tenant_user_id, {
            id: c.tenant_user_id,
            name: c.profiles?.full_name || "Unknown",
            email: c.profiles?.email || "",
          });
        }
      });
      return Array.from(unique.values());
    },
    enabled: !!merchant?.id,
  });

  const handleGenerate = async () => {
    setResult(null);
    setBatchResults(null);
    const res = await scoring.mutateAsync({ tenant_user_id: selectedTenant });
    if ("scoring" in res) setResult(res.scoring);
  };

  const handleBatch = async () => {
    setResult(null);
    setBatchResults(null);
    const res = await scoring.mutateAsync({ batch: true });
    if ("results" in res) setBatchResults(res.results);
  };

  const handleScreening = async () => {
    setResult(null);
    const res = await scoring.mutateAsync({ screening_data: screeningForm });
    if ("scoring" in res) setResult(res.scoring);
  };

  const exportBatchCsv = () => {
    if (!batchResults) return;
    const headers = "Nama,Quality Score,Grade,Payment Reliability,Risk Level,Decision\n";
    const rows = batchResults
      .filter((r) => !r.error)
      .map((r) => `"${r.name}",${r.quality_score},${r.quality_grade},${r.payment_reliability?.score || 0},${r.risk_profile?.level || ""},${r.screening_recommendation?.decision || ""}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tenant_quality_scores.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader icon={UserCheck} title="Kualitas Tenant" description="Penilaian kualitas & screening tenant dengan AI">
        <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
          <Sparkles className="h-3 w-3" /> AI-Powered
        </Badge>
      </PageHeader>

      <TierGatedFeature requiredTier="starter" currentTier={currentTier} featureName="Tenant Quality Scoring">
        <div className="space-y-6">
          {/* Mode Selector */}
          <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setResult(null); setBatchResults(null); }}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="existing">Tenant Existing</TabsTrigger>
              <TabsTrigger value="screening">Screening Calon Tenant</TabsTrigger>
            </TabsList>

            {/* Mode 1: Existing Tenant */}
            <TabsContent value="existing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pilih Tenant</CardTitle>
                  <CardDescription>Pilih tenant aktif untuk dinilai atau lakukan batch scoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Pilih tenant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(tenants || []).map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name} ({t.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleGenerate} disabled={!selectedTenant || scoring.isPending}>
                      {scoring.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Analisis
                    </Button>
                    <Button variant="outline" onClick={handleBatch} disabled={scoring.isPending}>
                      <Users className="h-4 w-4 mr-2" /> Batch Scoring
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Batch Results */}
              {batchResults && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Hasil Batch Scoring</CardTitle>
                      <CardDescription>{batchResults.filter((r) => !r.error).length} tenant berhasil dinilai</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportBatchCsv}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 px-3">Nama</th>
                            <th className="text-center py-2 px-3">Score</th>
                            <th className="text-center py-2 px-3">Grade</th>
                            <th className="text-center py-2 px-3">Payment</th>
                            <th className="text-center py-2 px-3">Risk</th>
                            <th className="text-center py-2 px-3">Decision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batchResults.filter((r) => !r.error).map((r) => (
                            <tr key={r.tenant_user_id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-2 px-3 font-medium">{r.name}</td>
                              <td className="py-2 px-3 text-center font-bold">{r.quality_score}</td>
                              <td className="py-2 px-3 text-center"><Badge variant="outline" className={GRADE_COLORS[r.quality_grade]}>{r.quality_grade}</Badge></td>
                              <td className="py-2 px-3 text-center">{r.payment_reliability?.score || 0}</td>
                              <td className="py-2 px-3 text-center"><Badge className={RISK_COLORS[r.risk_profile?.level || "low"]}>{r.risk_profile?.level}</Badge></td>
                              <td className="py-2 px-3 text-center"><Badge className={DECISION_CONFIG[r.screening_recommendation?.decision || "review"]?.color}>{r.screening_recommendation?.decision?.replace(/_/g, " ")}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Mode 2: Screening */}
            <TabsContent value="screening" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Calon Tenant</CardTitle>
                  <CardDescription>Masukkan data calon tenant untuk screening</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <Input value={screeningForm.name} onChange={(e) => setScreeningForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" />
                    </div>
                    <div className="space-y-2">
                      <Label>Pekerjaan</Label>
                      <Input value={screeningForm.occupation} onChange={(e) => setScreeningForm((p) => ({ ...p, occupation: e.target.value }))} placeholder="Jenis pekerjaan" />
                    </div>
                    <div className="space-y-2">
                      <Label>Penghasilan Bulanan (IDR)</Label>
                      <Input type="number" value={screeningForm.monthly_income || ""} onChange={(e) => setScreeningForm((p) => ({ ...p, monthly_income: Number(e.target.value) }))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Referensi (opsional)</Label>
                      <Input value={screeningForm.references || ""} onChange={(e) => setScreeningForm((p) => ({ ...p, references: e.target.value }))} placeholder="Kontak referensi" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Riwayat Sewa Sebelumnya (opsional)</Label>
                    <Textarea value={screeningForm.previous_rental_history || ""} onChange={(e) => setScreeningForm((p) => ({ ...p, previous_rental_history: e.target.value }))} placeholder="Deskripsikan riwayat sewa sebelumnya..." rows={3} />
                  </div>
                  <Button onClick={handleScreening} disabled={!screeningForm.name || !screeningForm.occupation || scoring.isPending}>
                    {scoring.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Screening
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Loading */}
          {scoring.isPending && (
            <Card>
              <CardContent className="flex items-center justify-center py-12 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">AI sedang menganalisis...</span>
              </CardContent>
            </Card>
          )}

          {/* Single Result */}
          {result && !scoring.isPending && (
            <div className="space-y-6">
              {/* Quality Score + Grade */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1">
                  <CardContent className="pt-6 text-center">
                    <div className="text-6xl font-bold font-display">{result.quality_score}</div>
                    <Badge className={`text-lg px-4 py-1 mt-3 ${GRADE_COLORS[result.quality_grade]}`}>Grade {result.quality_grade}</Badge>
                    <p className="text-sm text-muted-foreground mt-3">Quality Score</p>
                    <Progress value={result.quality_score} className="mt-3" />
                  </CardContent>
                </Card>

                {/* Payment Reliability */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Payment Reliability</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Score</span><span className="font-bold">{result.payment_reliability.score}/100</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">On-time Ratio</span><span className="font-medium">{(result.payment_reliability.on_time_ratio * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Days Late</span><span className="font-medium">{result.payment_reliability.avg_days_late.toFixed(1)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Trend</span><Badge variant="outline" className="capitalize">{result.payment_reliability.trend}</Badge></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Prediksi 6 Bulan</span>
                      <Badge className={result.payment_reliability.prediction_next_6_months === "reliable" ? "bg-success/15 text-success" : result.payment_reliability.prediction_next_6_months === "moderate_risk" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}>
                        {result.payment_reliability.prediction_next_6_months.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Profile */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Risk Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Level</span><Badge className={RISK_COLORS[result.risk_profile.level]}>{result.risk_profile.level}</Badge></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Churn Probability</span><span className="font-medium">{(result.risk_profile.churn_probability * 100).toFixed(1)}%</span></div>
                    {result.risk_profile.flags.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Flags</span>
                        {result.risk_profile.flags.map((f, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <AlertTriangle className={`h-3 w-3 mt-0.5 shrink-0 ${f.severity === "critical" || f.severity === "high" ? "text-destructive" : "text-warning"}`} />
                            <span>{f.flag}: {f.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Screening Recommendation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Screening Recommendation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const cfg = DECISION_CONFIG[result.screening_recommendation.decision] || DECISION_CONFIG.review;
                    const Icon = cfg.icon;
                    return (
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.color}`}><Icon className="h-5 w-5" /></div>
                        <div>
                          <Badge className={`text-sm ${cfg.color}`}>{result.screening_recommendation.decision.replace(/_/g, " ").toUpperCase()}</Badge>
                          <p className="text-sm text-muted-foreground mt-1">Deposit multiplier: {result.screening_recommendation.suggested_deposit_multiplier}x</p>
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-sm">{result.screening_recommendation.reasoning}</p>
                  {result.screening_recommendation.conditions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Kondisi</span>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {result.screening_recommendation.conditions.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Behavioral Insights */}
              {result.behavioral_insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Behavioral Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {result.behavioral_insights.map((bi, i) => (
                        <div key={i} className="rounded-xl border p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">{bi.category}</span>
                            <Badge variant="outline" className={bi.impact === "positive" ? "text-success border-success/30" : bi.impact === "negative" ? "text-destructive border-destructive/30" : "text-muted-foreground"}>
                              {bi.impact}
                            </Badge>
                          </div>
                          <p className="text-sm">{bi.observation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary */}
              <Card>
                <CardHeader><CardTitle className="text-base">Ringkasan AI</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{result.summary}</p>
                  <p className="text-xs text-muted-foreground mt-3">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </TierGatedFeature>
    </>
  );
}
