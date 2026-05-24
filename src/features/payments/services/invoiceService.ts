import { apiClient } from '@/lib/axios';
import { Invoice } from '../types';

export const invoiceService = {
  async getTenantInvoices(tenantId: string, limit?: number): Promise<Invoice[]> {
    try {
      const response = await apiClient.get('/billing/invoices', {
        params: {
          tenant_id: tenantId,
          status: 'pending,sent,overdue',
          ...(limit ? { limit } : {}),
        },
      });
      return response.data.data as Invoice[];
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch tenant invoices');
    }
  },

  async getAllTenantInvoices(tenantId: string): Promise<Invoice[]> {
    try {
      const response = await apiClient.get('/billing/invoices', {
        params: { tenant_id: tenantId },
      });
      return response.data.data as Invoice[];
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch all tenant invoices');
    }
  },

  async downloadInvoicePdf(invoiceId: string): Promise<{ pdfUrl?: string; html?: string }> {
    try {
      const response = await apiClient.get(`/billing/invoices/${invoiceId}/pdf`);
      return response.data.data;
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to download invoice PDF');
    }
  }
};
