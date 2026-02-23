import { useQuery } from "@tanstack/react-query";
import {
  fetchProperties,
  fetchUnits,
  fetchContracts,
  fetchTenantRiskScores,
  fetchDisasterRiskProfiles,
  DashboardFilters,
} from "../services/analyticsDashboardService";

export function useAnalyticsProperties(merchantId: string | undefined, yearRange?: number[]) {
  const filters: DashboardFilters | undefined = yearRange
    ? { yearMin: yearRange[0], yearMax: yearRange[1] }
    : undefined;

  return useQuery({
    queryKey: ["analytics-properties", merchantId, yearRange],
    queryFn: () => fetchProperties(merchantId!, filters),
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

export function useAnalyticsContracts(merchantId: string | undefined, yearRange?: number[]) {
  const filters: DashboardFilters | undefined = yearRange
    ? { yearMin: yearRange[0], yearMax: yearRange[1] }
    : undefined;

  return useQuery({
    queryKey: ["analytics-contracts", merchantId, yearRange],
    queryFn: () => fetchContracts(merchantId!, filters),
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
