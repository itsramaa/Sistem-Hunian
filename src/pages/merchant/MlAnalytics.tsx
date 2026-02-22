import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Progress } from "@/shared/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Loader2, TrendingUp, AlertTriangle, Users, DollarSign, RefreshCw, Lock, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useRevenueForecast, useTenantRiskScores, useRefreshRiskScore, useChurnPrediction, useOptimalPricing } from "@/features/dss/hooks/useMlAnalytics";
import { useMerchantTier } from "@/features/dss/hooks/useMerchantTier";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function MlAnalytics() {
  const { user } = useAuth();
  const { canAccess, tierName, isLoading: tierLoading } = useMerchantTier();

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

  const TierGate = ({ feature, children }: { feature: string; children: React.ReactNode }) => {
    if (tierLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!canAccess(feature)) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Lock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">This feature requires a higher subscription tier.</p>
            <Badge variant="outline" className="mt-2">{tierName} plan</Badge>
          </CardContent>
        </Card>
      );
    }
    return <>{children}</>;
  };

  const riskLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="ML Analytics" description="AI-powered predictive analytics for your properties" />

      <Tabs defaultValue="forecast">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast"><TrendingUp className="h-4 w-4 mr-1" />Forecast</TabsTrigger>
          <TabsTrigger value="risk"><AlertTriangle className="h-4 w-4 mr-1" />Risk</TabsTrigger>
          <TabsTrigger value="churn"><Users className="h-4 w-4 mr-1" />Churn</TabsTrigger>
          <TabsTrigger value="pricing"><DollarSign className="h-4 w-4 mr-1" />Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <TierGate feature="revenue_forecast">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>Predict monthly revenue with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleForecast} disabled={revenueForecast.isPending}>
                  {revenueForecast.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Generate Forecast
                </Button>
                {forecastResult && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Trend: <Badge variant="outline">{forecastResult.trend}</Badge></p>
                    <p className="text-sm text-muted-foreground">{forecastResult.summary}</p>
                    <div className="grid gap-2">
                      {forecastResult.predictions?.map((p: any) => (
                        <div key={p.month} className="flex items-center justify-between rounded-lg border p-3">
                          <span className="font-medium">{p.month}</span>
                          <span className="font-mono">Rp {p.predicted_revenue?.toLocaleString("id-ID")}</span>
                          <span className="text-xs text-muted-foreground">
                            ±{((p.upper_bound - p.lower_bound) / 2)?.toLocaleString("id-ID")}
                          </span>
                          <Badge variant="outline">{Math.round(p.confidence * 100)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TierGate>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <TierGate feature="risk_dashboard">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tenant Risk Scores</CardTitle>
                  <CardDescription>AI-assessed risk levels per tenant</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleBatchRisk} disabled={refreshRisk.isPending}>
                  {refreshRisk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-1">Refresh All</span>
                </Button>
              </CardHeader>
              <CardContent>
                {riskLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : (riskScores || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No risk scores yet. Click "Refresh All" to generate.</p>
                ) : (
                  <div className="space-y-2">
                    {(riskScores || []).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                        <span className="text-sm font-mono">{s.tenant_user_id?.slice(0, 8)}...</span>
                        <div className="flex-1 max-w-[120px]">
                          <Progress value={s.risk_score} className={`h-2 ${
                            s.risk_score >= 75 ? '[&>div]:bg-destructive' :
                            s.risk_score >= 50 ? '[&>div]:bg-warning' : '[&>div]:bg-success'
                          }`} />
                        </div>
                        <span className="font-bold text-sm">{s.risk_score}/100</span>
                        <Badge className={riskLevelColor(s.risk_level)}>{s.risk_level}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TierGate>
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <TierGate feature="custom_models">
            <Card>
              <CardHeader>
                <CardTitle>Churn Prediction</CardTitle>
                <CardDescription>Predict which tenants may leave</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleChurn} disabled={churnPrediction.isPending}>
                  {churnPrediction.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Predict Churn
                </Button>
                {churnResult && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{churnResult.summary}</p>
                    <p className="text-sm">High risk tenants: <Badge variant="destructive">{churnResult.high_risk_count}</Badge></p>
                    <div className="grid gap-2">
                      {churnResult.predictions?.map((p: any) => (
                        <div key={p.tenant_user_id} className="rounded-lg border p-3 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-mono">{p.tenant_user_id?.slice(0, 8)}...</span>
                            <Badge variant={p.churn_probability > 0.6 ? "destructive" : "outline"}>
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

        <TabsContent value="pricing" className="space-y-4">
          <TierGate feature="custom_models">
            <Card>
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
                        <div key={u.unit_id} className="flex items-center justify-between rounded-lg border p-3">
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
