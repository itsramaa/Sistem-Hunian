import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";
import { Link } from "react-router-dom";

export function TrialCountdownWidget() {
  const { merchant } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ["merchant-subscription-trial", merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchant_subscriptions")
        .select("*, tier:subscription_tiers(*)")
        .eq("merchant_id", merchant?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  if (!subscription || subscription.status !== "trialing" || !subscription.trial_ends_at) {
    return null;
  }

  const trialEndsAt = new Date(subscription.trial_ends_at);
  const now = new Date();
  const daysRemaining = differenceInDays(trialEndsAt, now);
  const hoursRemaining = differenceInHours(trialEndsAt, now) % 24;

  const isUrgent = daysRemaining <= 3;
  const isExpired = daysRemaining < 0;

  if (isExpired) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive">Trial Expired</p>
              <p className="text-sm text-muted-foreground">
                Upgrade now to continue using all features
              </p>
            </div>
            <Button size="sm" asChild>
              <Link to="/merchant/settings?tab=verification">
                Upgrade Now
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isUrgent ? "border-warning bg-warning/10" : "border-primary/30 bg-primary/5"}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isUrgent ? "bg-warning/20" : "bg-primary/20"}`}>
            <Clock className={`h-5 w-5 ${isUrgent ? "text-warning" : "text-primary"}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isUrgent ? "text-warning" : "text-primary"}`}>
                {daysRemaining}
              </span>
              <span className="text-sm text-muted-foreground">
                days {hoursRemaining > 0 && `${hoursRemaining}h`} remaining
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isUrgent 
                ? "Your trial is ending soon. Upgrade to keep access." 
                : "Trial period - Upgrade anytime to unlock all features"}
            </p>
          </div>
          <Button variant={isUrgent ? "default" : "outline"} size="sm" asChild>
            <Link to="/merchant/settings?tab=verification">
              {isUrgent ? "Upgrade Now" : "View Plans"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
