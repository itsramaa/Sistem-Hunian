import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { reconciliationService } from '../services/reconciliationService';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useReconciliation() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();

  const unmatchedKey = ['unmatched-payments', merchant?.id];
  const matchHistoryKey = ['match-history', merchant?.id];

  const unmatched = useQuery({
    queryKey: unmatchedKey,
    queryFn: () => {
      if (!merchant?.id) throw new Error('No merchant');
      return reconciliationService.fetchUnmatchedPayments(merchant.id);
    },
    enabled: !!merchant?.id,
    staleTime: 2 * 60 * 1000,
  });

  const matchHistory = useQuery({
    queryKey: matchHistoryKey,
    queryFn: () => {
      if (!merchant?.id) throw new Error('No merchant');
      return reconciliationService.fetchMatchHistory(merchant.id);
    },
    enabled: !!merchant?.id,
    staleTime: 2 * 60 * 1000,
  });

  const manualMatchMutation = useMutation({
    mutationFn: ({ paymentId, invoiceId, amount }: { paymentId: string; invoiceId: string; amount: number }) => {
      if (!merchant?.id) throw new Error('No merchant');
      return reconciliationService.manualMatch(paymentId, invoiceId, merchant.id, amount);
    },
    onSuccess: () => {
      toast.success('Pembayaran berhasil dicocokkan');
      queryClient.invalidateQueries({ queryKey: unmatchedKey });
      queryClient.invalidateQueries({ queryKey: matchHistoryKey });
    },
    onError: () => {
      toast.error('Gagal mencocokkan pembayaran');
    },
  });

  const autoMatchMutation = useMutation({
    mutationFn: (paymentId: string) => {
      if (!merchant?.id) throw new Error('No merchant');
      return reconciliationService.triggerAutoMatch(paymentId, merchant.id);
    },
    onSuccess: () => {
      toast.success('Auto-match diproses');
      queryClient.invalidateQueries({ queryKey: unmatchedKey });
      queryClient.invalidateQueries({ queryKey: matchHistoryKey });
    },
    onError: () => {
      toast.error('Gagal auto-match');
    },
  });

  // Realtime
  useEffect(() => {
    if (!merchant?.id) return;
    const channel = supabase
      .channel('reconciliation-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `merchant_id=eq.${merchant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: unmatchedKey });
          queryClient.invalidateQueries({ queryKey: matchHistoryKey });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [merchant?.id, queryClient]);

  return {
    unmatched,
    matchHistory,
    manualMatch: manualMatchMutation,
    autoMatch: autoMatchMutation,
  };
}
