import { useQuery } from '@tanstack/react-query';
import { merchantService } from '../../users/services/merchantService';

export function useMerchantAnalytics(merchantId: string) {
  const { 
    data: analytics = null, 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['merchant-analytics', merchantId],
    queryFn: () => merchantService.fetchMerchantAnalytics(merchantId),
    enabled: !!merchantId,
  });

  return { analytics, loading, error, refetch };
}
