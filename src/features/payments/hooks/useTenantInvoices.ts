import { useMutation, useQuery } from '@tanstack/react-query';
import { invoiceService } from '../services/invoiceService';

export const useTenantInvoices = (tenantId: string | undefined, limit?: number) => {
  return useQuery({
    queryKey: ['tenant-invoices-dashboard', tenantId, limit],
    queryFn: () => invoiceService.getTenantInvoices(tenantId!, limit),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAllTenantInvoices = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['tenant-invoices', tenantId],
    queryFn: () => invoiceService.getAllTenantInvoices(tenantId!),
    enabled: !!tenantId,
  });
};

export const useDownloadInvoice = () => {
  return useMutation({
    mutationFn: (invoiceId: string) => invoiceService.downloadInvoicePdf(invoiceId),
  });
};
