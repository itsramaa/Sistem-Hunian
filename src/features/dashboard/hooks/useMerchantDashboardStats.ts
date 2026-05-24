import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { merchantDashboardService } from '../services/merchantDashboardService';

export function useMerchantDashboardStats() {
  const { merchant } = useAuth();

  const queryKey = ['merchant-dashboard', merchant?.id];

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: () => {
      if (!merchant?.id) throw new Error('Merchant not authenticated');
      return merchantDashboardService.fetchStats(merchant.id);
    },
    enabled: !!merchant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Real-time subscription stubbed — TODO: implement WebSocket/SSE endpoint
  // Previously used supabase.channel() for live updates; now relies on manual refetch

  return {
    data,
    isLoading,
    error,
    refetch,
    isRefetching
  };
}
