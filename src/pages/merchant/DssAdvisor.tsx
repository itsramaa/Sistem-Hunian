import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Progress } from "@/shared/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Loader2, DollarSign, FileWarning, Wrench, TrendingUp, Check, X, Brain, Sparkles, Target, Clock, CheckCircle2, XCircle } from "lucide-react";
import { TierGate } from "@/features/dss/components/TierGate";
import { DssReadinessCard } from "@/features/dss/components/DssReadinessCard";
import { useDssReadiness } from "@/features/dss/hooks/useDssReadiness";
import { toast } from "sonner";
import { usePricingAdvisor, useCollectionStrategy, useMaintenancePriority, useInvestmentInsight, useDssRecommendations, useUpdateRecommendation } from "@/features/dss/hooks/useDssAdvisors";
import { useMerchantTier } from "@/features/dss/hooks/useMerchantTier";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  accepted: "bg-success/15 text-success border-success/30",
  dismissed: "bg-muted text-muted-foreground",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  accepted: <CheckCircle2 className="h-3.5 w-3.5" />,
  dismissed: <XCircle className="h-3.5 w-3.5" />,
  expired: <XCircle className="h-3.5 w-3.5" />,
};

export default function DssAdvisor() {
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
  const [activeTab, setActiveTab] = useState("pricing");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();

  // Fetch properties for selector
  const { data: properties } = useQuery({
    queryKey: ["merchant-properties-list", merchantId],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("merchant_id", merchantId!).order("name");
      return data || [];
    },
    enabled: !!merchantId,
  });

  const readiness = useDssReadiness(selectedPropertyId, merchantId);

  const { data: recommendations, isLoading: recsLoading } = useDssRecommendations(merchantId, activeTab);
  const updateRec = useUpdateRecommendation();

  const pricingAdvisor = usePricingAdvisor();
  const collectionStrategy = useCollectionStrategy();
  const maintenancePriority = useMaintenancePriority();
  const investmentInsight = useInvestmentInsight();

  const isGenerating = pricingAdvisor.isPending || collectionStrategy.isPending || maintenancePriority.isPending || investmentInsight.isPending;

  const handleGenerate = async () => {
    try {
      switch (activeTab) {
        case "pricing": {
          const { data: props } = await supabase.from("properties").select("id").eq("merchant_id", merchantId!).limit(1).single();
          if (!props) { toast.error("No property found"); return; }
          await pricingAdvisor.mutateAsync({ propertyId: props.id });
          break;
        }
        case "collection": {
          const { data: contracts } = await supabase.from("contracts").select("tenant_user_id").eq("merchant_id", merchantId!).eq("status", "active").limit(1).single();
          if (!contracts) { toast.error("No active tenant found"); return; }
          await collectionStrategy.mutateAsync({ tenantUserId: contracts.tenant_user_id });
          break;
        }
        case "maintenance":
          await maintenancePriority.mutateAsync();
          break;
        case "investment": {
          const { data: props } = await supabase.from("properties").select("id").eq("merchant_id", merchantId!).limit(1).single();
          if (!props) { toast.error("No property found"); return; }
          await investmentInsight.mutateAsync({ propertyId: props.id });
          break;
        }
      }
      toast.success("Recommendation generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate");
    }
  };

  const handleAction = async (id: string, action: "accept" | "dismiss") => {
    try {
      await updateRec.mutateAsync({ id, action });
      toast.success(action === "accept" ? "Recommendation accepted" : "Recommendation dismissed");
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const tabConfig = [
    { value: "pricing", label: "Pricing", icon: <DollarSign className="h-3.5 w-3.5" /> },
    { value: "collection", label: "Collection", icon: <FileWarning className="h-3.5 w-3.5" /> },
    { value: "maintenance", label: "Maintenance", icon: <Wrench className="h-3.5 w-3.5" /> },
    { value: "investment", label: "Investment", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  ];

  // Recommendation stats
  const pendingCount = (recommendations || []).filter((r: any) => r.status === 'pending').length;
  const acceptedCount = (recommendations || []).filter((r: any) => r.status === 'accepted').length;

  return (
    <div className="space-y-6">
      <PageHeader icon={Brain} title="DSS Advisor" description="AI-powered decision support recommendations">
        <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/30 gap-1.5">
          <Sparkles className="h-3 w-3" />
          AI-Powered
        </Badge>
      </PageHeader>

      {/* Property Selector */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium shrink-0">Pilih Properti:</label>
            <Select value={selectedPropertyId || ""} onValueChange={(v) => setSelectedPropertyId(v)}>
              <SelectTrigger className="w-[240px] rounded-xl">
                <SelectValue placeholder="Pilih properti..." />
              </SelectTrigger>
              <SelectContent>
                {(properties || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedPropertyId && <DssReadinessCard readiness={readiness} />}

      <TierGate propertyId={selectedPropertyId} merchantId={merchantId}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="pill-tab-list">
            {tabConfig.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="pill-tab-trigger gap-1.5">
                {tab.icon}{tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Summary KPI Strip */}
          {!recsLoading && (recommendations || []).length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="glass-stat-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{(recommendations || []).length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-stat-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-stat-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{acceptedCount}</p>
                    <p className="text-xs text-muted-foreground">Accepted</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {tabConfig.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-4">
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="gradient-icon-box">
                      {tab.icon}
                    </div>
                    <div>
                      <CardTitle>{tab.label} Advisor</CardTitle>
                      <CardDescription>Generate AI-powered {tab.label.toLowerCase()} recommendations</CardDescription>
                    </div>
                  </div>
                  <Button onClick={handleGenerate} disabled={isGenerating} className="gradient-cta rounded-xl shadow-sm gap-2">
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate
                  </Button>
                </CardHeader>
                <CardContent>
                  {recsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (recommendations || []).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center mx-auto mb-4">
                        <Brain className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">No recommendations yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "Generate" to create AI-powered recommendations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(recommendations || []).map((rec: any) => (
                        <div key={rec.id} className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4 space-y-3 hover:border-primary/20 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{rec.description}</p>
                            </div>
                            <Badge className={`rounded-full border gap-1 ${STATUS_COLORS[rec.status] || ""}`}>
                              {STATUS_ICONS[rec.status]}
                              {rec.status}
                            </Badge>
                          </div>
                          {rec.confidence_score && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Confidence</span>
                                <span className="font-medium">{Math.round(rec.confidence_score * 100)}%</span>
                              </div>
                              <Progress value={rec.confidence_score * 100} className="h-1.5 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/70" />
                            </div>
                          )}
                          {rec.status === "pending" && (
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" onClick={() => handleAction(rec.id, "accept")} disabled={updateRec.isPending} className="gradient-cta rounded-xl shadow-sm gap-1.5">
                                <Check className="h-3 w-3" />Accept
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleAction(rec.id, "dismiss")} disabled={updateRec.isPending} className="rounded-xl gap-1.5 text-muted-foreground">
                                <X className="h-3 w-3" />Dismiss
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(rec.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </TierGate>
    </div>
  );
}
