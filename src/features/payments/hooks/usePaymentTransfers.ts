import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { startOfWeek } from 'date-fns';

export interface PaymentTransfer {
  id: string;
  payment_id: string | null;
  merchant_id: string;
  amount: number;
  platform_fee: number;
  gateway_fee: number;
  net_amount: number;
  bank_account_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  external_reference: string | null;
  xendit_disbursement_id: string | null;
  failure_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  bank_account?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  } | null;
}

export interface TransferStats {
  pendingTotal: number;
  completedThisWeek: number;
  failedCount: number;
  sevenDayAverage: number;
}

export function usePaymentTransfers(merchantId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['payment-transfers', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data, error } = await supabase
        .from('payment_transfers' as any)
        .select('*, bank_accounts(bank_name, account_number, account_name)')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PaymentTransfer[];
    },
    enabled: !!merchantId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!merchantId) return;

    const channel = supabase
      .channel(`payment-transfers-${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_transfers',
          filter: `merchant_id=eq.${merchantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['payment-transfers', merchantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchantId, queryClient]);

  // Compute stats
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const stats: TransferStats = {
    pendingTotal: transfers
      .filter(t => t.status === 'pending' || t.status === 'processing')
      .reduce((sum, t) => sum + Number(t.net_amount), 0),
    completedThisWeek: transfers
      .filter(t => t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= weekStart)
      .reduce((sum, t) => sum + Number(t.net_amount), 0),
    failedCount: transfers.filter(t => t.status === 'failed').length,
    sevenDayAverage: (() => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const completed = transfers
        .filter(t => t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= sevenDaysAgo)
        .reduce((sum, t) => sum + Number(t.net_amount), 0);
      return completed / 7;
    })(),
  };

  // Retry failed transfer
  const retryTransfer = async (transferId: string, bankAccountId: string | null) => {
    const { error } = await supabase.functions.invoke('xendit-disbursement', {
      body: { payment_transfer_id: transferId, bank_account_id: bankAccountId },
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['payment-transfers', merchantId] });
  };

  return { transfers, stats, isLoading, retryTransfer };
}
