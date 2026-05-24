import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { apiClient } from "@/lib/axios";
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
      const response = await apiClient.get('/subscriptions/current', {
        params: { merchant_id: merchant?.id },
      });
      return response.data.data as SubscriptionData | null;
    },
    enabled: !!merchant?.id,
  });

  const { data: usage } = useQuery({
    queryKey: ["merchant-usage", merchant?.id],
    queryFn: async () => {
      const response = await apiClient.get('/subscriptions/usage', {
        params: { merchant_id: merchant?.id },
      });
      return response.data.data as { properties: number; units: number; tenants: number };
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
        return <Badge className="rounded-full bg-accent text-accent-foreground">Enterprise</Badge>;
      case "pro":
        return <Badge className="rounded-full bg-primary text-primary-foreground">Pro</Badge>;
      case "basic":
        return <Badge variant="secondary" className="rounded-full">Dasar</Badge>;
      default:
        return <Badge variant="outline" className="rounded-full">Gratis</Badge>;
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
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" role="status" aria-label="Memuat data langganan" />
        </CardContent>
      </Card>
    );
  }

  const tier = subscription?.tier || {
    name: "free",
    display_name: "Gratis",
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
    <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40" role="region" aria-label="Informasi Langganan dan Penggunaan">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTierIcon(tier.name)}
            <CardTitle className="text-lg">Langganan</CardTitle>
          </div>
          {getTierBadge(tier.name)}
        </div>
        <CardDescription>
          {tier.name === "free" ? (
            "Upgrade untuk membuka lebih banyak fitur"
          ) : (
            <>
              {formatPrice(tier.price_monthly)}/bulan
              {subscription?.current_period_end && (
                <span className="block text-xs mt-1">
                  Diperbarui {format(new Date(subscription.current_period_end), "dd MMM yyyy")}
                </span>
              )}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTrialing && trialEndsAt && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20" role="alert">
            <p className="text-sm font-medium text-primary">
              Masa trial berakhir {format(trialEndsAt, "dd MMM yyyy")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tambahkan metode pembayaran untuk melanjutkan setelah trial
            </p>
          </div>
        )}

        {/* Usage Stats */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                Properti
              </span>
              <span className="text-muted-foreground">
                {usage?.properties || 0} / {tier.max_properties}
              </span>
            </div>
            <Progress value={Math.min(propertiesUsage, 100)} className="h-2 rounded-full" aria-label={`Penggunaan Properti: ${usage?.properties || 0} dari ${tier.max_properties}`} />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                Unit
              </span>
              <span className="text-muted-foreground">
                {usage?.units || 0} / {tier.max_units}
              </span>
            </div>
            <Progress value={Math.min(unitsUsage, 100)} className="h-2 rounded-full" aria-label={`Penggunaan Unit: ${usage?.units || 0} dari ${tier.max_units}`} />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Penyewa
              </span>
              <span className="text-muted-foreground">
                {usage?.tenants || 0} / {tier.max_tenants}
              </span>
            </div>
            <Progress value={Math.min(tenantsUsage, 100)} className="h-2 rounded-full" aria-label={`Penggunaan Penyewa: ${usage?.tenants || 0} dari ${tier.max_tenants}`} />
          </div>
        </div>

        {tier.name === "free" ? (
          <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md" asChild>
            <Link to="/merchant/billing">
              Upgrade Paket
              <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button className="flex-1 rounded-xl" asChild>
              <Link to="/merchant/billing">
                Kelola Paket
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-xl text-muted-foreground hover:text-destructive"
              onClick={() => setShowCancelDialog(true)}
              title="Batalkan Langganan"
              aria-label="Batalkan Langganan"
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
