import { useQuery } from "@tanstack/react-query";
import { merchantService } from "../services/merchantService";
import { MerchantFilters } from "../types/admin-merchant";

export function useMerchants(filters: MerchantFilters = {}) {
  const { 
    data: merchants = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin-merchants', filters],
    queryFn: () => merchantService.fetchMerchants(filters),
  });

  const { data: activePaidCount = 0 } = useQuery({
    queryKey: ['admin-merchants-active-paid'],
    queryFn: () => merchantService.fetchActivePaidCount(),
  });

  return { merchants, loading, activePaidCount, refetch, error };
}
