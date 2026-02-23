import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Progress } from "@/shared/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Loader2, TrendingUp, AlertTriangle, Users, DollarSign, RefreshCw, BarChart3, Sparkles, Brain, Target, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRevenueForecast, useTenantRiskScores, useRefreshRiskScore, useChurnPrediction, useOptimalPricing, useModelRunHistory } from "@/features/dss/hooks/useMlAnalytics";
import { TierGate } from "@/features/dss/components/TierGate";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function MlAnalytics() {
  const { user } = useAuth();

  const { data: merchant } = useQuery({
    queryKey: ["merchant-id", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("merchants").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const merchantId = merchant?.id;

  const revenueForecast = useRevenueForecast();
  const { data: riskScores, isLoading: riskLoading } = useTenantRiskScores(merchantId);
  const refreshRisk = useRefreshRiskScore();
  const churnPrediction = useChurnPrediction();
  const optimalPricing = useOptimalPricing();
  const { data: modelRuns } = useModelRunHistory(merchantId);

  const [forecastResult, setForecastResult] = useState<any>(null);
  const [churnResult, setChurnResult] = useState<any>(null);
  const [pricingResult, setPricingResult] = useState<any>(null);

  const handleForecast = async () => {
    try {
      const result = await revenueForecast.mutateAsync({ forecastMonths: 6 });
      setForecastResult(result.forecast);
      toast.success("Revenue forecast generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate forecast");
    }
  };

  const handleBatchRisk = async () => {
    try {
      await refreshRisk.mutateAsync({ batch: true });
      toast.success("Risk scores updated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to refresh risk scores");
    }
  };

  const handleChurn = async () => {
    try {
      const result = await churnPrediction.mutateAsync({ windowMonths: 3 });
      setChurnResult(result.churn);
      toast.success("Churn prediction generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to predict churn");
    }
  };

  const riskLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-success/15 text-success border-success/30";
      case "medium": return "bg-warning/15 text-warning border-warning/30";
      case "high": return "bg-destructive/15 text-destructive border-destructive/30";
      case "critical": return "bg-destructive/15 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // KPI summary for risk tab
  const riskSummary = (riskScores || []).reduce(
    (acc: any, s: any) => {
      acc[s.risk_level] = (acc[s.risk_level] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const getModelStatus = (functionName: string) => {
    const run = (modelRuns || []).find(r => r.function_name === functionName);
    if (!run) return { label: "Belum Dijalankan", variant: "secondary" as const, color: "text-muted-foreground" };
    const hoursAgo = (Date.now() - new Date(run.last_run_at).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) return { label: "Terkini", variant: "default" as const, color: "text-success", run };
    if (hoursAgo < 24 * 7) return { label: "Perlu Update", variant: "secondary" as const, color: "text-warning", run };
    return { label: "Kadaluarsa", variant: "destructive" as const, color: "text-destructive", run };
  };

  const modelConfigs = [
    { name: "Revenue Forecast", fn: "ml-revenue-forecast", icon: TrendingUp },
    { name: "Tenant Risk Score", fn: "ml-tenant-risk-score", icon: AlertTriangle },
    { name: "Churn Prediction", fn: "ml-churn-prediction", icon: Users },
    { name: "Optimal Pricing", fn: "ml-optimal-pricing", icon: DollarSign },
    { name: "Price Intelligence", fn: "ml-price-intelligence", icon: BarChart3 },
    { name: "Occupancy Forecast", fn: "ml-occupancy-forecast", icon: Target },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={Brain} title="ML Analytics" description="AI-powered predictive analytics for your properties">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/30 gap-1.5">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
      </PageHeader>

      {/* Model Status Section */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="gradient-icon-box">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Status Model</CardTitle>
            <CardDescription>Kapan terakhir setiap model dijalankan</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {modelConfigs.map((mc) => {
              const status = getModelStatus(mc.fn);
              const Icon = mc.icon;
              return (
                <div key={mc.fn} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/80 p-3 hover:border-primary/20 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mc.name}</p>
                    {status.run ? (
                      <p className="text-xs text-muted-foreground">
                        {new Date(status.run.last_run_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                  <Badge variant={status.variant} className="rounded-full text-xs shrink-0">
                    {status.label === "Terkini" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList className="pill-tab-list">
          <TabsTrigger value="forecast" className="pill-tab-trigger gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />Forecast
          </TabsTrigger>
          <TabsTrigger value="risk" className="pill-tab-trigger gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />Risk
            {(riskScores || []).filter((s: any) => s.risk_level === 'high' || s.risk_level === 'critical').length > 0 && (
              <Badge variant="destructive" className="rounded-full ml-1 h-5 min-w-5 text-[10px] px-1.5">
                {(riskScores || []).filter((s: any) => s.risk_level === 'high' || s.risk_level === 'critical').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="churn" className="pill-tab-trigger gap-1.5">
            <Users className="h-3.5 w-3.5" />Churn
          </TabsTrigger>
          <TabsTrigger value="pricing" className="pill-tab-trigger gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-6">
          <TierGate feature="revenue_forecast">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="gradient-icon-box">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Revenue Forecast</CardTitle>
                    <CardDescription>Predict monthly revenue with confidence intervals</CardDescription>
                  </div>
                </div>
                <Button onClick={handleForecast} disabled={revenueForecast.isPending} className="gradient-cta rounded-xl shadow-sm gap-2">
                  {revenueForecast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Forecast
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {forecastResult ? (
                  <div className="space-y-4">
                    {/* Summary strip */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Trend: <Badge variant="outline" className="rounded-full ml-1">{forecastResult.trend}</Badge></p>
                        <p className="text-xs text-muted-foreground mt-0.5">{forecastResult.summary}</p>
                      </div>
                    </div>
                    {/* Predictions grid */}
                    <div className="grid gap-2">
                      {forecastResult.predictions?.map((p: any) => (
                        <div key={p.month} className="flex items-center justify-between rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-3 hover:border-primary/20 transition-colors">
                          <span className="font-semibold text-sm">{p.month}</span>
                          <span className="font-mono text-sm">Rp {p.predicted_revenue?.toLocaleString("id-ID")}</span>
                          <span className="text-xs text-muted-foreground">
                            ±{((p.upper_bound - p.lower_bound) / 2)?.toLocaleString("id-ID")}
                          </span>
                          <Badge variant="outline" className="rounded-full">{Math.round(p.confidence * 100)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm font-medium">No forecast generated yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Click "Generate Forecast" to predict future revenue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TierGate>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <TierGate feature="risk_dashboard">
            {/* Risk KPI Strip */}
            {(riskScores || []).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Low Risk", count: riskSummary.low || 0, color: "text-success", bg: "from-success/20 to-success/5" },
                  { label: "Medium Risk", count: riskSummary.medium || 0, color: "text-warning", bg: "from-warning/20 to-warning/5" },
                  { label: "High Risk", count: riskSummary.high || 0, color: "text-destructive", bg: "from-destructive/20 to-destructive/5" },
                  { label: "Critical", count: riskSummary.critical || 0, color: "text-destructive", bg: "from-destructive/20 to-destructive/5" },
                ].map((item) => (
                  <Card key={item.label} className="glass-stat-card">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center`}>
                        <AlertTriangle className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{item.count}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="gradient-icon-box">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Tenant Risk Scores</CardTitle>
                    <CardDescription>AI-assessed risk levels per tenant</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleBatchRisk} disabled={refreshRisk.isPending} className="rounded-xl gap-1.5">
                  {refreshRisk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh All
                </Button>
              </CardHeader>
              <CardContent>
                {riskLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (riskScores || []).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No risk scores yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Click "Refresh All" to generate risk assessments</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(riskScores || []).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-3 gap-3 hover:border-primary/20 transition-colors">
                        <span className="text-sm font-mono">{s.tenant_user_id?.slice(0, 8)}...</span>
                        <div className="flex-1 max-w-[120px]">
                          <Progress value={s.risk_score} className={`h-2 rounded-full ${
                            s.risk_score >= 75 ? '[&>div]:bg-destructive' :
                            s.risk_score >= 50 ? '[&>div]:bg-warning' : '[&>div]:bg-success'
                          }`} />
                        </div>
                        <span className="font-bold text-sm">{s.risk_score}/100</span>
                        <Badge className={`rounded-full border ${riskLevelColor(s.risk_level)}`}>{s.risk_level}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TierGate>
        </TabsContent>

        <TabsContent value="churn" className="space-y-6">
          <TierGate feature="custom_models">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="gradient-icon-box">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Churn Prediction</CardTitle>
                    <CardDescription>Predict which tenants may leave</CardDescription>
                  </div>
                </div>
                <Button onClick={handleChurn} disabled={churnPrediction.isPending} className="gradient-cta rounded-xl shadow-sm gap-2">
                  {churnPrediction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Predict Churn
                </Button>
              </CardHeader>
              <CardContent>
                {churnResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">{churnResult.summary}</p>
                        <p className="text-sm font-medium mt-1">High risk tenants: <Badge variant="destructive" className="rounded-full">{churnResult.high_risk_count}</Badge></p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      {churnResult.predictions?.map((p: any) => (
                        <div key={p.tenant_user_id} className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4 space-y-2 hover:border-primary/20 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-mono">{p.tenant_user_id?.slice(0, 8)}...</span>
                            <Badge variant={p.churn_probability > 0.6 ? "destructive" : "outline"} className="rounded-full">
                              {Math.round(p.churn_probability * 100)}% churn risk
                            </Badge>
                          </div>
                          {p.retention_suggestions?.length > 0 && (
                            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">💡 {p.retention_suggestions[0]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm font-medium">No churn analysis yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Click "Predict Churn" to identify at-risk tenants</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TierGate>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <TierGate feature="custom_models">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="gradient-icon-box">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Optimal Pricing</CardTitle>
                  <CardDescription>AI-suggested rental prices per unit</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {pricingResult ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{pricingResult.summary}</p>
                    <div className="grid gap-2">
                      {pricingResult.unit_suggestions?.map((u: any) => (
                        <div key={u.unit_id} className="flex items-center justify-between rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-3 hover:border-primary/20 transition-colors">
                          <span className="text-sm font-mono">{u.unit_id?.slice(0, 8)}</span>
                          <span className="text-sm text-muted-foreground">Current: Rp {u.current_price?.toLocaleString("id-ID")}</span>
                          <span className="text-sm font-bold text-primary">→ Rp {u.suggested_price?.toLocaleString("id-ID")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm font-medium">No pricing analysis yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Select a property from the Properties page, then use "Analyze Pricing"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TierGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}
