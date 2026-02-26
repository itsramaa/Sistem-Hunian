import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { expenseService, type CreateExpenseInput } from '../services/expenseService';
import { toast } from 'sonner';

export function useExpenses() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();

  const summaryKey = ['expense-summary', merchant?.id];
  const listKey = ['expense-list', merchant?.id];

  const summary = useQuery({
    queryKey: summaryKey,
    queryFn: () => {
      if (!merchant?.id) throw new Error('No merchant');
      return expenseService.fetchSummary(merchant.id);
    },
    enabled: !!merchant?.id,
    staleTime: 5 * 60 * 1000,
  });

  const expenses = useQuery({
    queryKey: listKey,
    queryFn: () => {
      if (!merchant?.id) throw new Error('No merchant');
      return expenseService.fetchExpenses(merchant.id);
    },
    enabled: !!merchant?.id,
    staleTime: 2 * 60 * 1000,
  });

  const createExpense = useMutation({
    mutationFn: (input: Omit<CreateExpenseInput, 'merchantId'>) => {
      if (!merchant?.id) throw new Error('No merchant');
      return expenseService.createExpense({ ...input, merchantId: merchant.id });
    },
    onSuccess: () => {
      toast.success('Pengeluaran berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: summaryKey });
      queryClient.invalidateQueries({ queryKey: listKey });
    },
    onError: () => {
      toast.error('Gagal menambahkan pengeluaran');
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      toast.success('Pengeluaran dihapus');
      queryClient.invalidateQueries({ queryKey: summaryKey });
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  return { summary, expenses, createExpense, deleteExpense };
}
