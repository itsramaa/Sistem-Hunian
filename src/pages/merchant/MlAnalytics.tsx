import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Progress } from "@/shared/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Loader2, TrendingUp, AlertTriangle, Users, DollarSign, RefreshCw, BarChart3, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRevenueForecast, useTenantRiskScores, useRefreshRiskScore, useChurnPrediction, useOptimalPricing } from "@/features/dss/hooks/useMlAnalytics";
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

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="ML Analytics" description="AI-powered predictive analytics for your properties" />

      <Tabs defaultValue="forecast">
        <TabsList className="inline-flex h-auto p-1 rounded-full bg-card/80 backdrop-blur-sm border border-border/40">
          <TabsTrigger value="forecast" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />Forecast
          </TabsTrigger>
          <TabsTrigger value="risk" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />Risk
          </TabsTrigger>
          <TabsTrigger value="churn" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-1.5">
            <Users className="h-3.5 w-3.5" />Churn
          </TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4 mt-6">
          <TierGate feature="revenue_forecast">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>Predict monthly revenue with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleForecast} disabled={revenueForecast.isPending} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm gap-2">
                  {revenueForecast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Forecast
                </Button>
                {forecastResult && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Trend: <Badge variant="outline" className="rounded-full">{forecastResult.trend}</Badge></p>
                    <p className="text-sm text-muted-foreground">{forecastResult.summary}</p>
                    <div className="grid gap-2">
                      {forecastResult.predictions?.map((p: any) => (
                        <div key={p.month} className="flex items-center justify-between rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-3">
                          <span className="font-semibold">{p.month}</span>
                          <span className="font-mono">Rp {p.predicted_revenue?.toLocaleString("id-ID")}</span>
                          <span className="text-xs text-muted-foreground">
                            ±{((p.upper_bound - p.lower_bound) / 2)?.toLocaleString("id-ID")}
                          </span>
                          <Badge variant="outline" className="rounded-full">{Math.round(p.confidence * 100)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TierGate>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4 mt-6">
          <TierGate feature="risk_dashboard">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tenant Risk Scores</CardTitle>
                  <CardDescription>AI-assessed risk levels per tenant</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleBatchRisk} disabled={refreshRisk.isPending} className="rounded-xl gap-1.5">
                  {refreshRisk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh All
                </Button>
              </CardHeader>
              <CardContent>
                {riskLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : (riskScores || []).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No risk scores yet. Click "Refresh All" to generate.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(riskScores || []).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-3 gap-3">
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

        <TabsContent value="churn" className="space-y-4 mt-6">
          <TierGate feature="custom_models">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader>
                <CardTitle>Churn Prediction</CardTitle>
                <CardDescription>Predict which tenants may leave</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleChurn} disabled={churnPrediction.isPending} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm gap-2">
                  {churnPrediction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Predict Churn
                </Button>
                {churnResult && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{churnResult.summary}</p>
                    <p className="text-sm">High risk tenants: <Badge variant="destructive" className="rounded-full">{churnResult.high_risk_count}</Badge></p>
                    <div className="grid gap-2">
                      {churnResult.predictions?.map((p: any) => (
                        <div key={p.tenant_user_id} className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-3 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-mono">{p.tenant_user_id?.slice(0, 8)}...</span>
                            <Badge variant={p.churn_probability > 0.6 ? "destructive" : "outline"} className="rounded-full">
                              {Math.round(p.churn_probability * 100)}% churn risk
                            </Badge>
                          </div>
                          {p.retention_suggestions?.length > 0 && (
                            <p className="text-xs text-muted-foreground">💡 {p.retention_suggestions[0]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TierGate>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 mt-6">
          <TierGate feature="custom_models">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader>
                <CardTitle>Optimal Pricing</CardTitle>
                <CardDescription>AI-suggested rental prices per unit</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Select a property from the Properties page, then use "Analyze Pricing" to get AI suggestions.</p>
                {pricingResult && (
                  <div className="space-y-3 mt-4">
                    <p className="text-sm text-muted-foreground">{pricingResult.summary}</p>
                    <div className="grid gap-2">
                      {pricingResult.unit_suggestions?.map((u: any) => (
                        <div key={u.unit_id} className="flex items-center justify-between rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-3">
                          <span className="text-sm font-mono">{u.unit_id?.slice(0, 8)}</span>
                          <span className="text-sm">Current: Rp {u.current_price?.toLocaleString("id-ID")}</span>
                          <span className="text-sm font-bold text-primary">→ Rp {u.suggested_price?.toLocaleString("id-ID")}</span>
                        </div>
                      ))}
                    </div>
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
