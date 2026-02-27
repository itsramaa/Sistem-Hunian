import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { merchantDashboardService } from '../services/merchantDashboardService';
import { useEffect } from 'react';
import { supabase } from '@/lib/integrations/supabase/client';
import { usePropertyContext } from '@/shared/stores/propertyContext';

export function useMerchantDashboardStats() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const selectedPropertyId = usePropertyContext((s) => s.selectedPropertyId);

  const queryKey = ['merchant-dashboard', merchant?.id, selectedPropertyId];

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: () => {
      if (!merchant?.id) throw new Error('Merchant not authenticated');
      return merchantDashboardService.fetchStats(merchant.id, selectedPropertyId);
    },
    enabled: !!merchant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Setup Realtime Subscription
  useEffect(() => {
    if (!merchant?.id) return;

    const channel = supabase
      .channel('merchant-dashboard-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments', filter: `merchant_id=eq.${merchant.id}` }, 
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'contracts', filter: `merchant_id=eq.${merchant.id}` }, 
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'properties', filter: `merchant_id=eq.${merchant.id}` }, 
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchant?.id, queryClient, queryKey]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isRefetching
  };
}
