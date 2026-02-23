import { useQuery } from "@tanstack/react-query";
import { fetchComparativePortfolioData } from "@/features/analytics/services/comparativePortfolioService";

export function useComparativePortfolio(merchantId: string) {
  return useQuery({
    queryKey: ["comparative-portfolio", merchantId],
    queryFn: () => fetchComparativePortfolioData(merchantId),
    enabled: !!merchantId,
  });
}
