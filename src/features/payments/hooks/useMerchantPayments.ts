import { supabase } from '@/lib/integrations/supabase/client';
import { useToast } from '@/shared/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Invoice, Payment } from '../types';

export function useMerchantPayments(merchantId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!merchantId,
  });

  // Fetch overdue invoices
  const { data: overdueInvoices = [], isLoading: overdueLoading } = useQuery({
    queryKey: ['overdue-invoices', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, total_amount, late_fee, due_date, tenant_user_id, overdue_since, grace_period_active')
        .eq('merchant_id', merchantId)
        .eq('status', 'pending')
        .lt('due_date', today)
        .is('payment_plan_id', null)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!merchantId,
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, payment_method, reference }: { id: string; payment_method: string; reference: string }) => {
      const payment = payments.find(p => p.id === id);
      if (!payment) throw new Error('Payment not found');
      
      if (payment.status === 'paid') {
        throw new Error('This payment is already marked as paid');
      }

      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          payment_method,
          reference: reference || null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
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

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-payment-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentId,
          tenantUserId: payment.tenant_user_id,
          type: 'manual'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reminder');
      }
      return response.json();
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
      const response = await fetch(`${SUPABASE_URL}/functions/v1/check-overdue-escalation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual', merchantId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send reminders');
      }
      return response.json();
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

  return {
    payments,
    overdueInvoices,
    isLoading: paymentsLoading || overdueLoading,
    refetchPayments: () => queryClient.invalidateQueries({ queryKey: ['payments', merchantId] }),
    markPaid: markPaidMutation.mutate,
    sendReminder: sendReminderMutation.mutate,
    sendBulkReminder: sendBulkReminderMutation.mutate,
    isMarkingPaid: markPaidMutation.isPending,
    isSendingReminder: sendReminderMutation.isPending,
    isSendingBulkReminder: sendBulkReminderMutation.isPending,
    sendingReminderId: sendReminderMutation.isPending ? sendReminderMutation.variables : null,
  };
}
