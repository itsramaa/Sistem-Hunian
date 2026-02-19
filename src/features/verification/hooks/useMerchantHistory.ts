import { useQuery } from "@tanstack/react-query";
import { merchantService } from '../../users/services/merchantService';

export function useMerchantHistory(merchantId: string) {
  const { 
    data: history = [], 
    isLoading: loading, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['merchant-history', merchantId],
    queryFn: () => merchantService.fetchMerchantHistory(merchantId),
    enabled: !!merchantId,
  });

  return { history, loading, refetch, error };
}
