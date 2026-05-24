import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";
import { Link } from "react-router-dom";

export function TrialCountdownWidget() {
  const { merchant } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ["merchant-subscription-trial", merchant?.id],
    queryFn: async () => {
      const response = await apiClient.get('/subscriptions/current', {
        params: { merchant_id: merchant?.id },
      });
      return response.data.data;
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
      <Card className="rounded-2xl border-destructive bg-destructive/10" role="alert">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/20" aria-hidden="true">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive">Trial Berakhir</p>
              <p className="text-sm text-muted-foreground">
                Upgrade sekarang untuk terus menggunakan semua fitur
              </p>
            </div>
            <Button size="sm" className="rounded-xl" asChild>
              <Link to="/merchant/settings?tab=verification">
                Upgrade Sekarang
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`rounded-2xl ${isUrgent ? "border-warning bg-warning/10" : "border-primary/30 bg-primary/5"}`} role="status">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isUrgent ? "bg-warning/20" : "bg-primary/20"}`} aria-hidden="true">
            <Clock className={`h-5 w-5 ${isUrgent ? "text-warning" : "text-primary"}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isUrgent ? "text-warning" : "text-primary"}`}>
                {daysRemaining}
              </span>
              <span className="text-sm text-muted-foreground">
                hari {hoursRemaining > 0 && `${hoursRemaining}j`} tersisa
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isUrgent 
                ? "Masa trial Anda segera berakhir. Upgrade untuk mempertahankan akses." 
                : "Periode Trial - Upgrade kapan saja untuk membuka semua fitur"}
            </p>
          </div>
          <Button variant={isUrgent ? "default" : "outline"} size="sm" className="rounded-xl" asChild>
            <Link to="/merchant/settings?tab=verification">
              {isUrgent ? "Upgrade Sekarang" : "Lihat Paket"}
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}