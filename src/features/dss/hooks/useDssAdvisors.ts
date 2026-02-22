import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  invokePricingAdvisor,
  invokeCollectionStrategy,
  invokeMaintenancePriority,
  invokeInvestmentInsight,
} from "../services/dssAdvisorService";

export function usePricingAdvisor() {
  return useMutation({
    mutationFn: ({ propertyId, context }: { propertyId: string; context?: string }) =>
      invokePricingAdvisor(propertyId, context),
  });
}

export function useCollectionStrategy() {
  return useMutation({
    mutationFn: ({ tenantUserId }: { tenantUserId: string }) =>
      invokeCollectionStrategy(tenantUserId),
  });
}

export function useMaintenancePriority() {
  return useMutation({
    mutationFn: () => invokeMaintenancePriority(),
  });
}

export function useInvestmentInsight() {
  return useMutation({
    mutationFn: ({ propertyId }: { propertyId: string }) =>
      invokeInvestmentInsight(propertyId),
  });
}

export function useDssRecommendations(merchantId?: string, type?: string) {
  return useQuery({
    queryKey: ["dss-recommendations", merchantId, type],
    queryFn: async () => {
      if (!merchantId) return [];
      let query = supabase
        .from("dss_recommendations")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false });
      if (type) query = query.eq("type", type);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantId,
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      rejectionReason,
    }: {
      id: string;
      action: "accept" | "dismiss";
      rejectionReason?: string;
    }) => {
      const updates: Record<string, unknown> =
        action === "accept"
          ? { status: "accepted", accepted_at: new Date().toISOString() }
          : { status: "dismissed", rejected_at: new Date().toISOString(), rejection_reason: rejectionReason };

      const { error } = await supabase
        .from("dss_recommendations")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dss-recommendations"] });
    },
  });
}
