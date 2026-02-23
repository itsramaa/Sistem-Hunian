import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Progress } from "@/shared/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Loader2, DollarSign, FileWarning, Wrench, TrendingUp, Check, X, Brain, Sparkles } from "lucide-react";
import { TierGate } from "@/features/dss/components/TierGate";
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

  const tabIcons: Record<string, React.ReactNode> = {
    pricing: <DollarSign className="h-3.5 w-3.5" />,
    collection: <FileWarning className="h-3.5 w-3.5" />,
    maintenance: <Wrench className="h-3.5 w-3.5" />,
    investment: <TrendingUp className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Brain} title="DSS Advisor" description="AI-powered decision support recommendations" />

      <TierGate>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="inline-flex h-auto p-1 rounded-full bg-card/80 backdrop-blur-sm border border-border/40">
            {["pricing", "collection", "maintenance", "investment"].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="rounded-full px-4 py-2 capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-1.5">
                {tabIcons[tab]}{tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {["pricing", "collection", "maintenance", "investment"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4 mt-6">
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">{tab} Advisor</CardTitle>
                    <CardDescription>Generate AI-powered {tab} recommendations</CardDescription>
                  </div>
                  <Button onClick={handleGenerate} disabled={isGenerating} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm gap-2">
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate
                  </Button>
                </CardHeader>
                <CardContent>
                  {recsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : (recommendations || []).length === 0 ? (
                    <div className="text-center py-10">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center mx-auto mb-3">
                        <Brain className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No recommendations yet. Click "Generate" to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(recommendations || []).map((rec: any) => (
                        <div key={rec.id} className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4 space-y-3 hover:border-primary/20 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{rec.description}</p>
                            </div>
                            <Badge className={`rounded-full border ${STATUS_COLORS[rec.status] || ""}`}>{rec.status}</Badge>
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
                              <Button size="sm" onClick={() => handleAction(rec.id, "accept")} disabled={updateRec.isPending} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm gap-1.5">
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
