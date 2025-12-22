import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Building2, Home, Users, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface UpgradePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: "properties" | "units" | "tenants";
}

export function UpgradePromptModal({ open, onOpenChange, limitType }: UpgradePromptModalProps) {
  const { merchant } = useAuth();

  const { data: currentTier } = useQuery({
    queryKey: ["current-tier", merchant?.id],
    queryFn: async () => {
      const { data: subscription } = await supabase
        .from("merchant_subscriptions")
        .select("tier:subscription_tiers(*)")
        .eq("merchant_id", merchant?.id)
        .maybeSingle();
      
      if (subscription?.tier) return subscription.tier;
      
      // Default free tier
      return {
        name: "free",
        display_name: "Free",
        max_properties: 1,
        max_units: 5,
        max_tenants: 5,
        price_monthly: 0,
      };
    },
    enabled: !!merchant?.id,
  });

  const { data: upgradeTiers = [] } = useQuery({
    queryKey: ["upgrade-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const limitLabels = {
    properties: "properties",
    units: "units",
    tenants: "tenants",
  };

  const limitIcons = {
    properties: Building2,
    units: Home,
    tenants: Users,
  };

  const LimitIcon = limitIcons[limitType];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Filter tiers that offer more than current tier
  const availableUpgrades = upgradeTiers.filter((tier) => {
    if (!currentTier) return true;
    const currentLimit = currentTier[`max_${limitType}` as keyof typeof currentTier] as number;
    const tierLimit = tier[`max_${limitType}` as keyof typeof tier] as number;
    return tierLimit > currentLimit;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-warning/20">
              <LimitIcon className="h-6 w-6 text-warning" />
            </div>
            <DialogTitle className="text-xl">Limit Reached</DialogTitle>
          </div>
          <DialogDescription>
            You've reached the maximum number of {limitLabels[limitType]} for your current plan.
            Upgrade to add more and unlock additional features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Plan */}
          {currentTier && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Plan</span>
                <Badge variant="secondary">{currentTier.display_name || currentTier.name}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 rounded bg-background">
                  <p className="font-semibold">{currentTier.max_properties}</p>
                  <p className="text-xs text-muted-foreground">Properties</p>
                </div>
                <div className="text-center p-2 rounded bg-background">
                  <p className="font-semibold">{currentTier.max_units}</p>
                  <p className="text-xs text-muted-foreground">Units</p>
                </div>
                <div className="text-center p-2 rounded bg-background">
                  <p className="font-semibold">{currentTier.max_tenants}</p>
                  <p className="text-xs text-muted-foreground">Tenants</p>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Upgrade Options</h4>
            {availableUpgrades.length > 0 ? (
              availableUpgrades.slice(0, 2).map((tier) => (
                <div
                  key={tier.id}
                  className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{tier.display_name}</span>
                    </div>
                    <span className="font-bold text-primary">
                      {formatPrice(tier.price_monthly)}/mo
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div className={`text-center p-2 rounded ${limitType === "properties" ? "bg-primary/20" : "bg-muted"}`}>
                      <p className="font-semibold">{tier.max_properties}</p>
                      <p className="text-xs text-muted-foreground">Properties</p>
                    </div>
                    <div className={`text-center p-2 rounded ${limitType === "units" ? "bg-primary/20" : "bg-muted"}`}>
                      <p className="font-semibold">{tier.max_units}</p>
                      <p className="text-xs text-muted-foreground">Units</p>
                    </div>
                    <div className={`text-center p-2 rounded ${limitType === "tenants" ? "bg-primary/20" : "bg-muted"}`}>
                      <p className="font-semibold">{tier.max_tenants}</p>
                      <p className="text-xs text-muted-foreground">Tenants</p>
                    </div>
                  </div>
                  {tier.features && Array.isArray(tier.features) && (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {(tier.features as string[]).slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                You're already on the highest plan. Contact support for custom solutions.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button className="flex-1" asChild>
            <Link to="/merchant/settings?tab=verification">
              View All Plans
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
