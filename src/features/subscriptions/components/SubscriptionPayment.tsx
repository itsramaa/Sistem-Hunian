import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { supabase } from "@/lib/integrations/supabase/client";
import { apiClient } from '@/lib/axios';
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import { useSubscriptionLimits } from "@/features/subscriptions/hooks/useSubscriptionLimits";
import { Crown, Star, Building2, Check, Loader2, Sparkles, ExternalLink, AlertTriangle } from "lucide-react";
interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  max_properties: number;
  max_units: number;
  max_tenants: number;
  features: string[] | null;
}

export function SubscriptionPayment() {
  const { merchant, user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false);
  const [downgradeTarget, setDowngradeTarget] = useState<SubscriptionTier | null>(null);

  const { data: limits } = useSubscriptionLimits();
  // Handle payment callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast({ title: "Payment successful!", description: "Your subscription is being activated." });
      queryClient.invalidateQueries({ queryKey: ["merchant-subscription"] });
    } else if (paymentStatus === 'failed') {
      toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
    }
  }, [searchParams, toast, queryClient]);

  const { data: tiers = [], isLoading: tiersLoading } = useQuery({
    queryKey: ["subscription-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as SubscriptionTier[];
    },
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ["merchant-subscription", merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchant_subscriptions")
        .select(`*, tier:subscription_tiers (*)`)
        .eq("merchant_id", merchant?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return <Crown className="h-6 w-6 text-accent" />;
      case "pro":
        return <Star className="h-6 w-6 text-primary" />;
      default:
        return <Building2 className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getSelectedTier = () => tiers.find(t => t.id === selectedTierId);
  const selectedTier = getSelectedTier();
  const selectedPrice = selectedTier 
    ? billingPeriod === "yearly" && selectedTier.price_yearly 
      ? selectedTier.price_yearly 
      : selectedTier.price_monthly
    : 0;

  // Check if this is a downgrade that exceeds limits
  const isDowngrade = (targetTier: SubscriptionTier) => {
    if (!currentSubscription?.tier) return false;
    const currentTier = currentSubscription.tier;
    return (
      targetTier.max_properties < currentTier.max_properties ||
      targetTier.max_units < currentTier.max_units ||
      targetTier.max_tenants < currentTier.max_tenants
    );
  };

  const exceedsLimits = (targetTier: SubscriptionTier) => {
    if (!limits) return false;
    return (
      limits.currentProperties > targetTier.max_properties ||
      limits.currentUnits > targetTier.max_units ||
      limits.currentTenants > targetTier.max_tenants
    );
  };

  const handleTierSelect = (tier: SubscriptionTier) => {
    // Check if downgrade exceeds current usage
    if (isDowngrade(tier) && exceedsLimits(tier)) {
      setDowngradeTarget(tier);
      setShowDowngradeWarning(true);
      return;
    }
    
    setSelectedTierId(tier.id);
    setShowUpgradeDialog(true);
  };

  const handleScheduleDowngrade = async () => {
    if (!downgradeTarget || !merchant || !currentSubscription) return;
    
    setIsProcessing(true);
    try {
      const { error } = await (supabase
        .from("subscription_changes" as any)
        .insert({
          merchant_id: merchant.id,
          from_tier_id: currentSubscription.tier_id,
          to_tier_id: downgradeTarget.id,
          change_type: "downgrade",
          effective_date: currentSubscription.current_period_end,
          reason: "Usage exceeds target tier limits - scheduled for end of period",
          status: "pending",
        } as any) as any);

      if (error) throw error;

      toast({
        title: "Downgrade scheduled",
        description: `Your plan will change to ${downgradeTarget.display_name} at the end of your current billing period.`,
      });
      setShowDowngradeWarning(false);
      setDowngradeTarget(null);
      queryClient.invalidateQueries({ queryKey: ["pending-subscription-changes"] });
    } catch (error) {
      console.error("Schedule downgrade error:", error);
      toast({
        title: "Error",
        description: "Could not schedule the downgrade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedTier || !merchant || !user) return;
    
    setIsProcessing(true);
    
    try {
      // For free tier, just update directly
      if (selectedTier.price_monthly === 0) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await supabase
          .from("merchant_subscriptions")
          .upsert({
            merchant_id: merchant.id,
            tier_id: selectedTier.id,
            status: "active",
            payment_status: "paid",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          }, { onConflict: "merchant_id" });

        // subscription_tier is now managed via merchant_subscriptions table (normalized)

        queryClient.invalidateQueries({ queryKey: ["merchant-subscription"] });
        toast({ title: "Plan updated!", description: `You are now on the ${selectedTier.display_name} plan.` });
        setShowUpgradeDialog(false);
        return;
      }

      // Call subscription payment API
      const response = await apiClient.post('/subscriptions/payment', {
        merchant_id: merchant.id,
        tier_id: selectedTier.id,
        billing_cycle: billingPeriod,
        user_id: user.id,
        payer_email: profile?.email || user.email,
        payer_name: profile?.full_name || merchant.business_name,
      });
      const data = response.data.data;

      if (data.payment_url) {
        // Redirect to Xendit payment page
        window.location.href = data.payment_url;
      } else if (data.free_tier) {
        queryClient.invalidateQueries({ queryKey: ["merchant-subscription"] });
        toast({ title: "Plan updated!", description: `You are now on the ${selectedTier.display_name} plan.` });
        setShowUpgradeDialog(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({ title: "Payment error", description: "Failed to process payment. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentTierName = currentSubscription?.tier?.name || "free";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Choose a plan that fits your business needs</CardDescription>
            </div>
            {currentSubscription?.tier && (
              <Badge className="bg-primary text-primary-foreground">
                Current: {currentSubscription.tier.display_name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {tiersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((tier) => {
                const isCurrent = tier.name === currentTierName;
                const isPopular = tier.name === "pro";
                
                return (
                  <Card key={tier.id} className={`relative ${isCurrent ? "border-primary ring-1 ring-primary" : ""} ${isPopular ? "border-accent" : ""}`}>
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-accent text-accent-foreground">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto mb-2">{getTierIcon(tier.name)}</div>
                      <CardTitle className="text-lg">{tier.display_name}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        <span className="text-3xl font-bold">{formatPrice(tier.price_monthly)}</span>
                        <span className="text-muted-foreground">/month</span>
                        {tier.price_yearly && (
                          <p className="text-sm text-muted-foreground mt-1">
                            or {formatPrice(tier.price_yearly)}/year (save 20%)
                          </p>
                        )}
                      </div>
                      <ul className="space-y-2 text-sm text-left">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          Up to {tier.max_properties} properties
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          Up to {tier.max_units} units
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          Up to {tier.max_tenants} tenants
                        </li>
                        {tier.features && Array.isArray(tier.features) && tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={isCurrent ? "outline" : isPopular ? "default" : "secondary"}
                        disabled={isCurrent}
                        onClick={() => handleTierSelect(tier)}
                      >
                        {isCurrent ? "Current Plan" : tier.price_monthly === 0 ? "Downgrade" : "Upgrade"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              You're about to subscribe to {selectedTier?.display_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTier && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  {getTierIcon(selectedTier.name)}
                  <div>
                    <p className="font-medium">{selectedTier.display_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTier.description}</p>
                  </div>
                </div>
                
                <RadioGroup value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as "monthly" | "yearly")}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                      <span className="font-medium">Monthly</span>
                      <span className="ml-2 text-muted-foreground">{formatPrice(selectedTier.price_monthly)}/month</span>
                    </Label>
                  </div>
                  {selectedTier.price_yearly && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg border">
                      <RadioGroupItem value="yearly" id="yearly" />
                      <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                        <span className="font-medium">Yearly</span>
                        <span className="ml-2 text-muted-foreground">{formatPrice(selectedTier.price_yearly)}/year</span>
                        <Badge variant="secondary" className="ml-2">Save 20%</Badge>
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
                <span className="font-medium">Total Due Now</span>
                <span className="text-xl font-bold">{formatPrice(selectedPrice)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={!selectedTier || isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedTier?.price_monthly === 0 ? (
                "Confirm Change"
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Warning Dialog */}
      <Dialog open={showDowngradeWarning} onOpenChange={setShowDowngradeWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Usage Exceeds Target Plan Limits
            </DialogTitle>
            <DialogDescription>
              Your current usage exceeds the limits of the {downgradeTarget?.display_name} plan.
            </DialogDescription>
          </DialogHeader>

          {downgradeTarget && limits && (
            <div className="space-y-4">
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You cannot immediately switch to this plan. You must reduce your usage first, or schedule this change for the end of your billing period.
                </AlertDescription>
              </Alert>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="font-medium text-sm">Current Usage vs {downgradeTarget.display_name} Limits:</p>
                <ul className="space-y-1 text-sm">
                  <li className={limits.currentProperties > downgradeTarget.max_properties ? "text-destructive font-medium" : ""}>
                    Properties: {limits.currentProperties} / {downgradeTarget.max_properties}
                    {limits.currentProperties > downgradeTarget.max_properties && " ⚠️"}
                  </li>
                  <li className={limits.currentUnits > downgradeTarget.max_units ? "text-destructive font-medium" : ""}>
                    Units: {limits.currentUnits} / {downgradeTarget.max_units}
                    {limits.currentUnits > downgradeTarget.max_units && " ⚠️"}
                  </li>
                  <li className={limits.currentTenants > downgradeTarget.max_tenants ? "text-destructive font-medium" : ""}>
                    Tenants: {limits.currentTenants} / {downgradeTarget.max_tenants}
                    {limits.currentTenants > downgradeTarget.max_tenants && " ⚠️"}
                  </li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDowngradeWarning(false)}>
              Cancel
            </Button>
            <Button 
              variant="secondary"
              onClick={handleScheduleDowngrade}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule for End of Period"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}