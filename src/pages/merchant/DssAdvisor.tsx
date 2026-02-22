import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Loader2, DollarSign, FileWarning, Wrench, TrendingUp, Check, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { usePricingAdvisor, useCollectionStrategy, useMaintenancePriority, useInvestmentInsight, useDssRecommendations, useUpdateRecommendation } from "@/features/dss/hooks/useDssAdvisors";
import { useMerchantTier } from "@/features/dss/hooks/useMerchantTier";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  dismissed: "bg-muted text-muted-foreground",
  expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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

  const TierGate = ({ children }: { children: React.ReactNode }) => {
    if (tierLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!canAccess("ai_recommendations")) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Lock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">DSS Advisor requires Professional or higher plan.</p>
            <Badge variant="outline" className="mt-2">{tierName}</Badge>
          </CardContent>
        </Card>
      );
    }
    return <>{children}</>;
  };

  const tabIcons: Record<string, React.ReactNode> = {
    pricing: <DollarSign className="h-4 w-4 mr-1" />,
    collection: <FileWarning className="h-4 w-4 mr-1" />,
    maintenance: <Wrench className="h-4 w-4 mr-1" />,
    investment: <TrendingUp className="h-4 w-4 mr-1" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">DSS Advisor</h1>
        <p className="text-muted-foreground">AI-powered decision support recommendations</p>
      </div>

      <TierGate>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {["pricing", "collection", "maintenance", "investment"].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tabIcons[tab]}{tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {["pricing", "collection", "maintenance", "investment"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">{tab} Advisor</CardTitle>
                    <CardDescription>Generate AI-powered {tab} recommendations</CardDescription>
                  </div>
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Generate
                  </Button>
                </CardHeader>
                <CardContent>
                  {recsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : (recommendations || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recommendations yet. Click "Generate" to create one.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {(recommendations || []).map((rec: any) => (
                        <div key={rec.id} className="rounded-lg border p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                            </div>
                            <Badge className={STATUS_COLORS[rec.status] || ""}>{rec.status}</Badge>
                          </div>
                          {rec.confidence_score && (
                            <p className="text-xs text-muted-foreground">
                              Confidence: {Math.round(rec.confidence_score * 100)}%
                            </p>
                          )}
                          {rec.status === "pending" && (
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" variant="outline" onClick={() => handleAction(rec.id, "accept")} disabled={updateRec.isPending}>
                                <Check className="h-3 w-3 mr-1" />Accept
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleAction(rec.id, "dismiss")} disabled={updateRec.isPending}>
                                <X className="h-3 w-3 mr-1" />Dismiss
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
