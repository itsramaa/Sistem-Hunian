import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { merchantInvoiceService, CreateInvoicePayload } from '../services/merchantInvoiceService';

export const useMerchantInvoices = (merchantId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['merchant-invoices', merchantId],
    queryFn: () => merchantInvoiceService.getInvoices(merchantId!),
    enabled: !!merchantId,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (payload: CreateInvoicePayload) => merchantInvoiceService.createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-invoices', merchantId] });
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: ({ invoiceId, merchantName }: { invoiceId: string; merchantName: string }) => 
      merchantInvoiceService.sendInvoice(invoiceId, merchantName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-invoices', merchantId] });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: ({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) => 
      merchantInvoiceService.markAsPaid(invoiceId, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-invoices', merchantId] });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: ({ invoiceId, tenantUserId }: { invoiceId: string; tenantUserId: string }) => 
      merchantInvoiceService.sendPaymentReminder(invoiceId, tenantUserId),
  });

  const generatePdfMutation = useMutation({
    mutationFn: (invoiceId: string) => merchantInvoiceService.generatePdf(invoiceId),
  });

  return {
    invoices,
    isLoading,
    error,
    createInvoiceMutation,
    sendInvoiceMutation,
    markAsPaidMutation,
    sendReminderMutation,
    generatePdfMutation,
  };
};
