import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Crown, Star, Building2, Users, Home, ArrowRight, Loader2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { CancelSubscriptionDialog } from "@/features/subscriptions/components/CancelSubscriptionDialog";

interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  max_properties: number;
  max_units: number;
  max_tenants: number;
  features: any;
}

interface SubscriptionData {
  id: string;
  status: string;
  current_period_end: string;
  trial_ends_at: string | null;
  tier: SubscriptionTier;
}

export function SubscriptionWidget() {
  const { merchant } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["merchant-subscription", merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchant_subscriptions")
        .select(`
          *,
          tier:subscription_tiers (*)
        `)
        .eq("merchant_id", merchant?.id)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionData | null;
    },
    enabled: !!merchant?.id,
  });

  const { data: usage } = useQuery({
    queryKey: ["merchant-usage", merchant?.id],
    queryFn: async () => {
      const [propertiesRes, unitsRes, contractsRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact" }).eq("merchant_id", merchant?.id),
        supabase.from("units").select("id, property:properties!inner(merchant_id)", { count: "exact" }).eq("property.merchant_id", merchant?.id),
        supabase.from("contracts").select("id", { count: "exact" }).eq("merchant_id", merchant?.id).eq("status", "active"),
      ]);
      return {
        properties: propertiesRes.count || 0,
        units: unitsRes.count || 0,
        tenants: contractsRes.count || 0,
      };
    },
    enabled: !!merchant?.id,
  });

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return <Crown className="h-5 w-5 text-accent" />;
      case "pro":
        return <Star className="h-5 w-5 text-primary" />;
      default:
        return <Building2 className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return <Badge className="bg-accent text-accent-foreground">Enterprise</Badge>;
      case "pro":
        return <Badge className="bg-primary text-primary-foreground">Pro</Badge>;
      case "basic":
        return <Badge variant="secondary">Basic</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const tier = subscription?.tier || {
    name: "free",
    display_name: "Free",
    max_properties: 1,
    max_units: 5,
    max_tenants: 5,
    price_monthly: 0,
  };

  const propertiesUsage = usage ? (usage.properties / tier.max_properties) * 100 : 0;
  const unitsUsage = usage ? (usage.units / tier.max_units) * 100 : 0;
  const tenantsUsage = usage ? (usage.tenants / tier.max_tenants) * 100 : 0;

  const isTrialing = subscription?.status === "trialing" && subscription?.trial_ends_at;
  const trialEndsAt = isTrialing ? new Date(subscription.trial_ends_at!) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTierIcon(tier.name)}
            <CardTitle className="text-lg">Subscription</CardTitle>
          </div>
          {getTierBadge(tier.name)}
        </div>
        <CardDescription>
          {tier.name === "free" ? (
            "Upgrade to unlock more features"
          ) : (
            <>
              {formatPrice(tier.price_monthly)}/month
              {subscription?.current_period_end && (
                <span className="block text-xs mt-1">
                  Renews {format(new Date(subscription.current_period_end), "MMM dd, yyyy")}
                </span>
              )}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTrialing && trialEndsAt && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-primary">
              Trial ends {format(trialEndsAt, "MMM dd, yyyy")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add payment method to continue after trial
            </p>
          </div>
        )}

        {/* Usage Stats */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Properties
              </span>
              <span className="text-muted-foreground">
                {usage?.properties || 0} / {tier.max_properties}
              </span>
            </div>
            <Progress value={Math.min(propertiesUsage, 100)} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                Units
              </span>
              <span className="text-muted-foreground">
                {usage?.units || 0} / {tier.max_units}
              </span>
            </div>
            <Progress value={Math.min(unitsUsage, 100)} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Tenants
              </span>
              <span className="text-muted-foreground">
                {usage?.tenants || 0} / {tier.max_tenants}
              </span>
            </div>
            <Progress value={Math.min(tenantsUsage, 100)} className="h-2" />
          </div>
        </div>

        {tier.name === "free" ? (
          <Button className="w-full" asChild>
            <Link to="/merchant/billing">
              Upgrade Plan
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button className="flex-1" asChild>
              <Link to="/merchant/billing">
                Manage Plan
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setShowCancelDialog(true)}
              title="Cancel Subscription"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>

      {subscription && (
        <CancelSubscriptionDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          subscriptionId={subscription.id}
        />
      )}
    </Card>
  );
}
