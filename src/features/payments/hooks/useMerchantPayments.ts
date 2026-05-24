import { apiClient } from '@/lib/axios';
import { useToast } from '@/shared/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Invoice, Payment } from '../types';

export function useMerchantPayments(merchantId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const response = await apiClient.get('/v1/payments', { params: { merchant_id: merchantId, sort: 'due_date:desc' } });
      return (response.data.data || []) as Payment[];
    },
    enabled: !!merchantId,
  });

  // Fetch overdue invoices (without active payment plans)
  const { data: overdueInvoices = [], isLoading: overdueLoading } = useQuery({
    queryKey: ['overdue-invoices', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get('/v1/billing/invoices', {
        params: { merchant_id: merchantId, status: 'pending', due_before: today, exclude_with_active_plans: true, sort: 'due_date:asc' },
      });
      return (response.data.data || []) as Invoice[];
    },
    enabled: !!merchantId,
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, payment_method, reference, proof_photo_url }: { id: string; payment_method: string; reference: string; proof_photo_url?: string }) => {
      const payment = payments.find(p => p.id === id);
      if (!payment) throw new Error('Payment not found');
      if (payment.status === 'paid') throw new Error('This payment is already marked as paid');

      await apiClient.patch(`/v1/payments/${id}/mark-paid`, {
        payment_method,
        reference: reference || null,
        paid_at: new Date().toISOString(),
        proof_photo_url: proof_photo_url || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Payment marked as paid', description: 'The payment has been recorded successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update payment', description: error.message, variant: 'destructive' });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');
      const response = await apiClient.post(`/v1/payments/${paymentId}/send-reminder`, {
        tenantUserId: payment.tenant_user_id,
        type: 'manual',
      });
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Reminder sent', description: 'Payment reminder sent to tenant' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send reminder', description: error.message, variant: 'destructive' });
    },
  });

  const sendBulkReminderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/v1/payments/bulk-remind', { source: 'manual', merchantId });
      return response.data;
    },
    onSuccess: (data) => {
      const processed = data.processed || 0;
      const failed = data.failed || 0;
      let description = `Processed ${processed} overdue invoice${processed !== 1 ? 's' : ''}`;
      if (failed > 0) {
        description += `. ${failed} failed to send.`;
      }
      toast({ title: 'Reminders Sent', description });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send reminders', description: error.message, variant: 'destructive' });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payload: {
      contract_id: string;
      tenant_user_id: string;
      merchant_id: string;
      amount: number;
      payment_type: string;
      payment_method: string | null;
      reference: string | null;
      due_date: string;
      status: string;
      proof_photo_url?: string | null;
    }) => {
      await apiClient.post('/v1/payments', {
        ...payload,
        paid_at: payload.status === 'paid' ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Pembayaran dibuat', description: 'Pembayaran baru berhasil ditambahkan' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal membuat pembayaran', description: error.message, variant: 'destructive' });
    },
  });

  return {
    payments,
    overdueInvoices,
    isLoading: paymentsLoading || overdueLoading,
    refetchPayments: () => queryClient.invalidateQueries({ queryKey: ['payments', merchantId] }),
    markPaid: markPaidMutation.mutate,
    createPayment: createPaymentMutation.mutate,
    isCreatingPayment: createPaymentMutation.isPending,
    sendReminder: sendReminderMutation.mutate,
    sendBulkReminder: sendBulkReminderMutation.mutate,
    isMarkingPaid: markPaidMutation.isPending,
    isSendingReminder: sendReminderMutation.isPending,
    isSendingBulkReminder: sendBulkReminderMutation.isPending,
    sendingReminderId: sendReminderMutation.isPending ? sendReminderMutation.variables : null,
  };
}
