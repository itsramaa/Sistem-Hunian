import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantContracts } from '@/features/contracts/hooks/useMerchantContracts';
import { useMerchantInvoices } from '@/features/payments/hooks/useMerchantInvoices';
import { Invoice } from '@/features/payments/types';
import { toast } from 'sonner';
import { useState } from 'react';

export function useInvoiceActions() {
  const { merchant } = useAuth();
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

  const { contracts: allContracts = [] } = useMerchantContracts(merchant?.id);
  const activeContracts = allContracts.filter(c => c.status === 'active');

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
      toast.success('Faktur berhasil dibuat');
      setIsCreateOpen(false);
    } catch (error) {
      toast.error('Gagal membuat faktur: ' + (error as Error).message);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await sendInvoiceMutation.mutateAsync({
        invoiceId,
        merchantName: merchant?.business_name || 'Landlord',
      });
      toast.success('Faktur berhasil dikirim ke penyewa');
    } catch (error) {
      toast.error('Gagal mengirim faktur');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string, currentStatus: string) => {
    try {
      await markAsPaidMutation.mutateAsync({ invoiceId, currentStatus });
      toast.success('Faktur ditandai lunas');
      setViewInvoice(null);
    } catch (error) {
      toast.error('Gagal memperbarui faktur: ' + (error as Error).message);
    }
  };

  const handleSendReminder = async (invoiceId: string, tenantUserId: string) => {
    try {
      await sendReminderMutation.mutateAsync({ invoiceId, tenantUserId });
      toast.success('Pengingat pembayaran berhasil dikirim');
    } catch (error) {
      toast.error('Gagal mengirim pengingat: ' + (error as Error).message);
    }
  };

  const downloadInvoicePdf = async (invoiceId: string) => {
    try {
      const toastId = toast.loading('Membuat PDF...');
      const result = await generatePdfMutation.mutateAsync(invoiceId);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
      }
      toast.dismiss(toastId);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat PDF');
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
