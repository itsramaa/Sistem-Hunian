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

export interface ModelRunStatus {
  function_name: string;
  last_run_at: string;
  execution_time_ms: number | null;
  output_summary: string | null;
}

export function useModelRunHistory(merchantId?: string) {
  return useQuery({
    queryKey: ["model-run-history", merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      // Get latest run per function_name
      const { data, error } = await supabase
        .from("ml_model_runs")
        .select("function_name, created_at, execution_time_ms, output_summary")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      // Group by function_name, keep only latest
      const map = new Map<string, ModelRunStatus>();
      for (const row of data || []) {
        if (!map.has(row.function_name)) {
          map.set(row.function_name, {
            function_name: row.function_name,
            last_run_at: row.created_at,
            execution_time_ms: row.execution_time_ms,
            output_summary: row.output_summary,
          });
        }
      }
      return Array.from(map.values());
    },
    enabled: !!merchantId,
  });
}
