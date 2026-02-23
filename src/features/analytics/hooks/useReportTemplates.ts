import { useQuery } from "@tanstack/react-query";
import {
  fetchExecutiveSummary,
  fetchPropertyAnalysis,
  fetchFinancialPerformance,
  fetchRiskAssessment,
  fetchInvestmentOpportunity,
} from "@/features/analytics/services/reportTemplateService";

export function useExecutiveSummary(merchantId: string, enabled = false) {
  return useQuery({
    queryKey: ["report-executive-summary", merchantId],
    queryFn: () => fetchExecutiveSummary(merchantId),
    enabled: !!merchantId && enabled,
  });
}

export function usePropertyAnalysis(merchantId: string, propertyId: string, enabled = false) {
  return useQuery({
    queryKey: ["report-property-analysis", merchantId, propertyId],
    queryFn: () => fetchPropertyAnalysis(merchantId, propertyId),
    enabled: !!merchantId && !!propertyId && enabled,
  });
}

export function useFinancialPerformance(merchantId: string, enabled = false) {
  return useQuery({
    queryKey: ["report-financial-performance", merchantId],
    queryFn: () => fetchFinancialPerformance(merchantId),
    enabled: !!merchantId && enabled,
  });
}

export function useRiskAssessment(merchantId: string, enabled = false) {
  return useQuery({
    queryKey: ["report-risk-assessment", merchantId],
    queryFn: () => fetchRiskAssessment(merchantId),
    enabled: !!merchantId && enabled,
  });
}

export function useInvestmentOpportunity(merchantId: string, enabled = false) {
  return useQuery({
    queryKey: ["report-investment-opportunity", merchantId],
    queryFn: () => fetchInvestmentOpportunity(merchantId),
    enabled: !!merchantId && enabled,
  });
}
