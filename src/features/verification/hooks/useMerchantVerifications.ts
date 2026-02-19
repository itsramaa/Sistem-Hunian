import { useQuery } from "@tanstack/react-query";
import { merchantService } from '@/features/users/services/merchantService';

export function useMerchantVerifications(merchantId: string | null) {
  const { 
    data: verifications = [], 
    isLoading: loading, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['merchant-verifications', merchantId],
    queryFn: () => merchantId ? merchantService.fetchVerifications(merchantId) : Promise.resolve([]),
    enabled: !!merchantId,
  });

  return { verifications, loading, refetch, error };
}
