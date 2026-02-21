import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { SubscriptionTier } from "@/features/subscriptions/types/subscription-tier";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import { Building2, Check, Crown, Edit2, Star, Trash2 } from "lucide-react";

interface SubscriptionTierCardProps {
  tier: SubscriptionTier;
  activeCount?: number;
  onEdit: (tier: SubscriptionTier) => void;
  onDelete: (tier: SubscriptionTier) => void;
}

export function SubscriptionTierCard({
  tier,
  activeCount = 0,
  onEdit,
  onDelete,
}: SubscriptionTierCardProps) {
  return (
    <Card className={cn("relative flex flex-col", !tier.is_active && "opacity-75 bg-muted/50")}>
      {!tier.is_active && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary">Inactive</Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant={tier.is_active ? "default" : "outline"} className="capitalize">
            {tier.name.replace(/_/g, " ")}
          </Badge>
          {tier.name === 'enterprise' && <Crown className="h-5 w-5 text-yellow-500" />}
          {tier.name === 'pro' && <Star className="h-5 w-5 text-primary" />}
          {tier.name === 'starter' && <Building2 className="h-5 w-5 text-muted-foreground" />}
        </div>
        <CardTitle className="text-2xl">{tier.display_name}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-[40px]">
          {tier.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {formatCurrency(tier.price_monthly)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            <Badge variant="outline" className="ml-2">
              {activeCount} active
            </Badge>
          </div>
          {tier.price_yearly && (
            <div className="text-sm text-muted-foreground">
              {formatCurrency(tier.price_yearly)}/yr (save {Math.round((1 - tier.price_yearly / (tier.price_monthly * 12)) * 100)}%)
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Up to {tier.max_properties} properties</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Up to {tier.max_units} units</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Up to {tier.max_tenants} tenants</span>
          </div>
          {tier.trial_days && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{tier.trial_days}-day free trial</span>
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(tier)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(tier)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
