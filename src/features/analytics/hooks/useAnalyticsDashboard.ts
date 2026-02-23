import { useQuery } from "@tanstack/react-query";
import {
  fetchProperties,
  fetchUnits,
  fetchContracts,
  fetchTenantRiskScores,
  fetchDisasterRiskProfiles,
} from "../services/analyticsDashboardService";

export function useAnalyticsProperties(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["analytics-properties", merchantId],
    queryFn: () => fetchProperties(merchantId!),
    enabled: !!merchantId,
  });
}

export function useAnalyticsUnits(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["analytics-units", merchantId],
    queryFn: () => fetchUnits(merchantId!),
    enabled: !!merchantId,
  });
}

export function useAnalyticsContracts(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["analytics-contracts", merchantId],
    queryFn: () => fetchContracts(merchantId!),
    enabled: !!merchantId,
  });
}

export function useAnalyticsTenantRiskScores(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["analytics-tenant-risk", merchantId],
    queryFn: () => fetchTenantRiskScores(merchantId!),
    enabled: !!merchantId,
  });
}

export function useAnalyticsDisasterRisk(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["analytics-disaster-risk", merchantId],
    queryFn: () => fetchDisasterRiskProfiles(merchantId!),
    enabled: !!merchantId,
  });
}
