import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Building2, Check, Loader2, Sparkles, ExternalLink } from "lucide-react";

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

        await supabase
          .from("merchants")
          .update({ subscription_tier: selectedTier.name })
          .eq("id", merchant.id);

        queryClient.invalidateQueries({ queryKey: ["merchant-subscription"] });
        toast({ title: "Plan updated!", description: `You are now on the ${selectedTier.display_name} plan.` });
        setShowUpgradeDialog(false);
        return;
      }

      // Call subscription payment edge function
      const { data, error } = await supabase.functions.invoke('subscription-payment', {
        body: {
          merchant_id: merchant.id,
          tier_id: selectedTier.id,
          billing_cycle: billingPeriod,
          user_id: user.id,
          payer_email: profile?.email || user.email,
          payer_name: profile?.full_name || merchant.business_name,
        },
      });

      if (error) throw error;

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
                        onClick={() => {
                          setSelectedTierId(tier.id);
                          setShowUpgradeDialog(true);
                        }}
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
    </>
  );
}