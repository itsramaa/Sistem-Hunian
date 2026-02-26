import { useQuery } from "@tanstack/react-query";
import { financialReportService } from "../services/financialReportService";

export function useFinancialSummary(merchantId?: string, months = 6) {
  return useQuery({
    queryKey: ["financial-summary", merchantId, months],
    queryFn: () => financialReportService.fetchFinancialSummary(merchantId!, months),
    enabled: !!merchantId,
  });
}
