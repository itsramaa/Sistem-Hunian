import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  invokeRevenueForecast,
  invokeTenantRiskScore,
  invokeChurnPrediction,
  invokeOptimalPricing,
} from "../services/mlService";

export function useRevenueForecast() {
  return useMutation({
    mutationFn: ({ forecastMonths, propertyId }: { forecastMonths?: number; propertyId?: string }) =>
      invokeRevenueForecast(forecastMonths, propertyId),
  });
}

export function useTenantRiskScores(merchantId?: string) {
  return useQuery({
    queryKey: ["tenant-risk-scores", merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data, error } = await supabase
        .from("tenant_risk_scores")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("risk_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantId,
  });
}

export function useRefreshRiskScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantUserId, batch }: { tenantUserId?: string; batch?: boolean }) =>
      invokeTenantRiskScore(tenantUserId, batch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-risk-scores"] });
    },
  });
}

export function useChurnPrediction() {
  return useMutation({
    mutationFn: ({ windowMonths }: { windowMonths?: number }) =>
      invokeChurnPrediction(windowMonths),
  });
}

export function useOptimalPricing() {
  return useMutation({
    mutationFn: ({ propertyId }: { propertyId: string }) =>
      invokeOptimalPricing(propertyId),
  });
}
