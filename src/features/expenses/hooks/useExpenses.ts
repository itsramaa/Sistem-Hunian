import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { expenseService, type CreateExpenseInput } from '../services/expenseService';
import { toast } from 'sonner';

export function useExpenses() {
  const { merchant, user } = useAuth();
  const queryClient = useQueryClient();

  const summaryKey = ['expense-summary', merchant?.id];
  const listKey = ['expense-list', merchant?.id];
  const pendingKey = ['expense-pending', merchant?.id];

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

  const pendingApprovals = useQuery({
    queryKey: pendingKey,
    queryFn: () => {
      if (!merchant?.id) throw new Error('No merchant');
      return expenseService.fetchPendingApprovals(merchant.id);
    },
    enabled: !!merchant?.id,
    staleTime: 60 * 1000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: summaryKey });
    queryClient.invalidateQueries({ queryKey: listKey });
    queryClient.invalidateQueries({ queryKey: pendingKey });
  };

  const createExpense = useMutation({
    mutationFn: (input: Omit<CreateExpenseInput, 'merchantId'>) => {
      if (!merchant?.id) throw new Error('No merchant');
      return expenseService.createExpense({ ...input, merchantId: merchant.id });
    },
    onSuccess: () => {
      toast.success('Pengeluaran berhasil ditambahkan');
      invalidateAll();
    },
    onError: () => {
      toast.error('Gagal menambahkan pengeluaran');
    },
  });

  const approveExpense = useMutation({
    mutationFn: (id: string) => {
      if (!user?.id) throw new Error('No user');
      return expenseService.approveExpense(id, user.id);
    },
    onSuccess: () => {
      toast.success('Pengeluaran disetujui');
      invalidateAll();
    },
    onError: () => {
      toast.error('Gagal menyetujui pengeluaran');
    },
  });

  const rejectExpense = useMutation({
    mutationFn: (id: string) => expenseService.rejectExpense(id),
    onSuccess: () => {
      toast.success('Pengeluaran ditolak');
      invalidateAll();
    },
    onError: () => {
      toast.error('Gagal menolak pengeluaran');
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      toast.success('Pengeluaran dihapus');
      invalidateAll();
    },
  });

  return { summary, expenses, pendingApprovals, createExpense, approveExpense, rejectExpense, deleteExpense };
}
