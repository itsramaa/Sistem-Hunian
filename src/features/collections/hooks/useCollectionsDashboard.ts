import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { collectionsService } from '../services/collectionsService';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCollectionsDashboard() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  const summaryKey = ['collections-summary', merchant?.id];
  const detailKey = ['collections-detail', merchant?.id, selectedBucket];

  const summary = useQuery({
    queryKey: summaryKey,
    queryFn: () => {
      if (!merchant?.id) throw new Error('No merchant');
      return collectionsService.fetchSummary(merchant.id);
    },
    enabled: !!merchant?.id,
    staleTime: 2 * 60 * 1000,
  });

  const invoices = useQuery({
    queryKey: detailKey,
    queryFn: () => {
      if (!merchant?.id) throw new Error('No merchant');
      return collectionsService.fetchOutstandingInvoices(merchant.id, selectedBucket || undefined);
    },
    enabled: !!merchant?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Realtime invalidation
  useEffect(() => {
    if (!merchant?.id) return;

    const channel = supabase
      .channel('collections-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter: `merchant_id=eq.${merchant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: summaryKey });
          queryClient.invalidateQueries({ queryKey: ['collections-detail', merchant.id] });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `merchant_id=eq.${merchant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: summaryKey });
          queryClient.invalidateQueries({ queryKey: ['collections-detail', merchant.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [merchant?.id, queryClient]);

  return {
    summary,
    invoices,
    selectedBucket,
    setSelectedBucket,
  };
}
