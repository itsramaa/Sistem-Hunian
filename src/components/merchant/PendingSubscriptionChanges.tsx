import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowRight, Clock, X, Loader2, CalendarClock } from "lucide-react";

interface PendingChange {
  id: string;
  change_type: string;
  effective_date: string;
  status: string;
  reason: string | null;
  current_tier: {
    display_name: string;
  } | null;
  pending_tier: {
    display_name: string;
  } | null;
}

export function PendingSubscriptionChanges() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingChanges = [], isLoading } = useQuery({
    queryKey: ["pending-subscription-changes", merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_subscription_changes")
        .select(`
          *,
          current_tier:subscription_tiers!pending_subscription_changes_current_tier_id_fkey(display_name),
          pending_tier:subscription_tiers!pending_subscription_changes_pending_tier_id_fkey(display_name)
        `)
        .eq("merchant_id", merchant?.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as PendingChange[];
    },
    enabled: !!merchant?.id,
  });

  const cancelMutation = useMutation({
    mutationFn: async (changeId: string) => {
      const { error } = await supabase
        .from("pending_subscription_changes")
        .update({ 
          status: "cancelled",
          cancelled_at: new Date().toISOString()
        })
        .eq("id", changeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-subscription-changes"] });
      toast({
        title: "Change cancelled",
        description: "Your scheduled subscription change has been cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not cancel the change. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || pendingChanges.length === 0) {
    return null;
  }

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case "downgrade":
        return <Badge variant="secondary">Downgrade</Badge>;
      case "upgrade":
        return <Badge className="bg-success text-success-foreground">Upgrade</Badge>;
      case "cancel":
        return <Badge variant="destructive">Cancellation</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-5 w-5 text-warning" />
          Scheduled Changes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingChanges.map((change) => (
          <Alert key={change.id} className="border-warning/30">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getChangeTypeBadge(change.change_type)}
                    {change.current_tier && change.pending_tier && (
                      <span className="flex items-center gap-1 text-sm">
                        <span className="font-medium">{change.current_tier.display_name}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">{change.pending_tier.display_name}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Effective on{" "}
                    <strong>{format(new Date(change.effective_date), "dd MMMM yyyy", { locale: id })}</strong>
                  </p>
                  {change.reason && (
                    <p className="text-sm text-muted-foreground">Reason: {change.reason}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelMutation.mutate(change.id)}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
