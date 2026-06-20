import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantInvoices } from '@/features/payments/hooks/useMerchantInvoices';
import { Invoice } from '@/features/payments/types';
import { useToast } from '@/shared/hooks/use-toast';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/integrations/supabase/client';

export function useInvoiceActions() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const {
    invoices,
    isLoading,
    createInvoiceMutation,
    sendInvoiceMutation,
    markAsPaidMutation,
    sendReminderMutation,
    generatePdfMutation,
  } = useMerchantInvoices(merchant?.id);

  const { data: allContracts = [] } = useQuery({
    queryKey: ['merchant-contracts', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('id, tenant_user_id, rent_amount, status, unit:units(unit_number, property:properties(name))')
        .eq('merchant_id', merchant.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchant?.id,
  });
  const activeContracts = allContracts.filter((c: any) => c.status === 'active');

  const handleCreateInvoice = async (data: {
    contract_id: string;
    merchant_id: string;
    tenant_user_id: string;
    amount: number;
    tax_amount: number;
    description: string;
    due_date: string;
  }) => {
    try {
      await createInvoiceMutation.mutateAsync(data);
      toast({ title: 'Invoice created successfully' });
      setIsCreateOpen(false);
    } catch (error) {
      toast({ title: 'Failed to create invoice', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await sendInvoiceMutation.mutateAsync({
        invoiceId,
        merchantName: merchant?.business_name || 'Landlord',
      });
      toast({ title: 'Invoice sent successfully', description: 'Email notification sent to tenant' });
    } catch (error) {
      toast({ title: 'Failed to send invoice', variant: 'destructive' });
    }
  };

  const handleMarkAsPaid = async (invoiceId: string, currentStatus: string) => {
    try {
      await markAsPaidMutation.mutateAsync({ invoiceId, currentStatus });
      toast({ title: 'Invoice marked as paid' });
      setViewInvoice(null);
    } catch (error) {
      toast({ title: 'Failed to update invoice', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSendReminder = async (invoiceId: string, tenantUserId: string) => {
    try {
      await sendReminderMutation.mutateAsync({ invoiceId, tenantUserId });
      toast({ title: 'Reminder sent', description: 'Payment reminder sent to tenant' });
    } catch (error) {
      toast({ title: 'Failed to send reminder', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const downloadInvoicePdf = async (invoiceId: string) => {
    try {
      toast({ title: 'Generating PDF...', description: 'Please wait' });
      const result = await generatePdfMutation.mutateAsync(invoiceId);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  return {
    invoices,
    isLoading,
    activeContracts,
    merchantId: merchant?.id || '',

    // Dialog state
    isCreateOpen,
    setIsCreateOpen,
    viewInvoice,
    setViewInvoice,

    // Actions
    handleCreateInvoice,
    handleSendInvoice,
    handleMarkAsPaid,
    handleSendReminder,
    downloadInvoicePdf,

    // Mutations (for loading states)
    createInvoiceMutation,
    sendInvoiceMutation,
    sendReminderMutation,
  };
}
