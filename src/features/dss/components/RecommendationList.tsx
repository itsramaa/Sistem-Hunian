import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RecommendationCard } from "@/shared/components/dss/RecommendationCard";
import { Badge } from "@/shared/components/ui/badge";
import { Loader2, Brain, TrendingUp, Shield, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/utils";

type RecommendationStatus = "generated" | "viewed" | "accepted" | "rejected" | "measured";

const statusConfig: Record<RecommendationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  generated: { label: "Baru", variant: "secondary" },
  viewed: { label: "Dilihat", variant: "outline" },
  accepted: { label: "Diterima", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
  measured: { label: "Terukur", variant: "default" },
};

const typeIcons: Record<string, React.ReactNode> = {
  revenue: <TrendingUp className="h-4 w-4" />,
  risk: <Shield className="h-4 w-4" />,
  efficiency: <Zap className="h-4 w-4" />,
  default: <Brain className="h-4 w-4" />,
};

interface RecommendationListProps {
  merchantId?: string;
  className?: string;
}

export function RecommendationList({ merchantId, className }: RecommendationListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["dss-recommendations", merchantId],
    queryFn: async () => {
      let query = supabase
        .from("dss_recommendations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (merchantId) {
        query = query.eq("merchant_id", merchantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "reject" | "defer" }) => {
      const updates: Record<string, unknown> = {};
      if (action === "accept") {
        updates.status = "accepted";
        updates.accepted_at = new Date().toISOString();
      } else if (action === "reject") {
        updates.status = "rejected";
        updates.rejected_at = new Date().toISOString();
      } else {
        // defer - no status change, just acknowledge
        return;
      }

      const { error } = await supabase
        .from("dss_recommendations")
        .update(updates)
        .eq("id", id);
      if (error) throw error;

      // Log to validation audit
      await supabase.from("dss_validation_logs").insert({
        entity_type: "dss_recommendation",
        entity_id: id,
        validation_type: "state_transition",
        validation_result: "valid",
        old_state: "generated",
        new_state: updates.status as string,
        performed_by: user?.id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dss-recommendations"] });
      toast.success("Rekomendasi diperbarui");
    },
    onError: () => {
      toast.error("Gagal memperbarui rekomendasi");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Brain className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Belum ada rekomendasi AI</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {recommendations.map((rec) => {
        const status = rec.status as RecommendationStatus;
        const config = statusConfig[status] || statusConfig.generated;
        const priority = rec.type === "risk" ? "high" : rec.type === "revenue" ? "medium" : "low";
        const impact = rec.impact_estimate
          ? typeof rec.impact_estimate === "object" && rec.impact_estimate !== null
            ? (rec.impact_estimate as Record<string, string>).description || undefined
            : undefined
          : undefined;

        return (
          <div key={rec.id} className="relative">
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              <span className="text-muted-foreground">{typeIcons[rec.type] || typeIcons.default}</span>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <RecommendationCard
              title={rec.title}
              description={rec.description || ""}
              confidence={rec.confidence_score || 70}
              priority={priority}
              category={rec.type}
              impact={impact}
              onAction={
                status === "generated" || status === "viewed"
                  ? (action) => actionMutation.mutate({ id: rec.id, action })
                  : undefined
              }
              isLoading={actionMutation.isPending}
            />
          </div>
        );
      })}
    </div>
  );
}
