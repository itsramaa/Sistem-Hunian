import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { differenceInDays } from "date-fns";
import { AlertTriangle, ExternalLink, Clock } from "lucide-react";

export function SuspensionWarningBanner() {
  const { merchant } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ["merchant-subscription-status", merchant?.id],
    queryFn: async () => {
      // TODO: Migrate to Go endpoint — GET /v1/merchants/:id/subscription-status
      const response = await apiClient.get(`/merchants/${merchant?.id}/subscription-status`);
      return response.data.data as { status: string; grace_period_end: string | null } | null;
    },
    enabled: !!merchant?.id,
  });

  const { data: pendingInvoice } = useQuery({
    queryKey: ["pending-subscription-invoice", merchant?.id],
    queryFn: async () => {
      // TODO: Migrate to Go endpoint — GET /v1/merchants/:id/subscription-invoices?status=pending
      const response = await apiClient.get(`/merchants/${merchant?.id}/subscription-invoices`, {
        params: { status: 'pending', limit: 1, sort: 'created_at:desc' },
      });
      const data = response.data.data?.[0];
      return data ? { id: data.id, xendit_payment_url: data.xendit_payment_url, amount: data.amount } : null;
    },
    enabled: !!merchant?.id && subscription?.status === "suspended",
  });

  // Only show for suspended subscriptions
  if (!subscription || subscription.status !== "suspended") {
    return null;
  }

  const gracePeriodEnd = subscription.grace_period_end 
    ? new Date(subscription.grace_period_end) 
    : null;
  
  const daysRemaining = gracePeriodEnd 
    ? Math.max(0, differenceInDays(gracePeriodEnd, new Date()))
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">Subscription Suspended</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p>Your subscription has been suspended due to a failed payment.</p>
            {gracePeriodEnd && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  {daysRemaining > 0 ? (
                    <>
                      <strong>{daysRemaining} days</strong> remaining in grace period before cancellation.
                    </>
                  ) : (
                    <strong className="text-destructive">Grace period has ended. Please pay immediately to restore access.</strong>
                  )}
                </span>
              </div>
            )}
            {pendingInvoice && (
              <p className="text-sm">
                Outstanding amount: <strong>{formatPrice(pendingInvoice.amount)}</strong>
              </p>
            )}
          </div>
          {pendingInvoice?.xendit_payment_url && (
            <Button
              variant="default"
              className="shrink-0"
              onClick={() => window.open(pendingInvoice.xendit_payment_url!, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
