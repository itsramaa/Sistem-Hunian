import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { financialControlService } from '../services/financialControlService';
import { expenseService } from '@/features/expenses/services/expenseService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/shared/hooks/use-toast';

export function useFinancialControl() {
  const { merchant, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ['financial-control', merchant?.id];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => financialControlService.fetchFinancialControlData(merchant!.id),
    enabled: !!merchant?.id,
    staleTime: 2 * 60 * 1000,
  });

  const approveExpense = useMutation({
    mutationFn: (id: string) => expenseService.approveExpense(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Pengeluaran disetujui' });
    },
    onError: () => toast({ title: 'Gagal menyetujui', variant: 'destructive' }),
  });

  const rejectExpense = useMutation({
    mutationFn: (id: string) => expenseService.rejectExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Pengeluaran ditolak' });
    },
    onError: () => toast({ title: 'Gagal menolak', variant: 'destructive' }),
  });

  const approveDepositRefund = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deposit_refunds')
        .update({ status: 'approved' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Refund deposit disetujui' });
    },
    onError: () => toast({ title: 'Gagal menyetujui refund', variant: 'destructive' }),
  });

  const rejectDepositRefund = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deposit_refunds')
        .update({ status: 'rejected' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Refund deposit ditolak' });
    },
    onError: () => toast({ title: 'Gagal menolak refund', variant: 'destructive' }),
  });

  const approveMoveOut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('move_out_notices')
        .update({ status: 'approved', acknowledged_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Move-out disetujui' });
    },
    onError: () => toast({ title: 'Gagal menyetujui move-out', variant: 'destructive' }),
  });

  const rejectMoveOut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('move_out_notices')
        .update({ status: 'rejected' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Move-out ditolak' });
    },
    onError: () => toast({ title: 'Gagal menolak move-out', variant: 'destructive' }),
  });

  return {
    data,
    isLoading,
    error,
    approveExpense,
    rejectExpense,
    approveDepositRefund,
    rejectDepositRefund,
    approveMoveOut,
    rejectMoveOut,
  };
}
