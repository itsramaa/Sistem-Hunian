import { useQuery } from '@tanstack/react-query';
import { merchantService } from '../../users/services/merchantService';

export function useMerchantActivity(merchantId: string) {
  const { 
    data: logs = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['merchant-activity', merchantId],
    queryFn: () => merchantService.fetchMerchantActivity(merchantId),
    enabled: !!merchantId,
  });

  return { logs, loading, error, refetch };
}
