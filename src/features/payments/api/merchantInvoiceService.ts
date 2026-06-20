import { apiClient } from '@/shared/lib/axios';
import { Invoice } from '../types';
import { format } from 'date-fns';

export interface CreateInvoicePayload {
  contract_id: string;
  merchant_id: string;
  tenant_user_id: string;
  amount: number;
  tax_amount: number;
  description: string;
  due_date: string;
}

export const merchantInvoiceService = {
  async getInvoices(merchantId: string): Promise<Invoice[]> {
    try {
      const response = await apiClient.get('/billing/invoices', {
        params: { merchant_id: merchantId },
      });
      return response.data.data as Invoice[];
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch invoices');
    }
  },

  async getInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const response = await apiClient.get(`/billing/invoices/${invoiceId}`);
      return response.data.data as Invoice;
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to fetch invoice');
    }
  },

  async createInvoice(payload: CreateInvoicePayload): Promise<void> {
    const { contract_id, merchant_id, tenant_user_id, amount, tax_amount, description, due_date } = payload;

    // Validate due date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(due_date);
    if (dueDateObj < today) {
      throw new Error('Due date cannot be in the past');
    }

    try {
      await apiClient.post('/billing/invoices', {
        contract_id,
        merchant_id,
        tenant_user_id,
        amount,
        tax_amount,
        total_amount: amount + tax_amount,
        description: description.slice(0, 1000),
        due_date,
        status: 'draft',
      });
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to create invoice');
    }
  },

  async sendInvoice(invoiceId: string, _merchantName: string): Promise<void> {
    try {
      await apiClient.put(`/billing/invoices/${invoiceId}/status`, { status: 'sent' });
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to send invoice');
    }
  },

  async markAsPaid(invoiceId: string, _currentStatus: string): Promise<void> {
    try {
      await apiClient.put(`/billing/invoices/${invoiceId}/status`, { status: 'paid' });
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to mark invoice as paid');
    }
  },

  async sendPaymentReminder(invoiceId: string, tenantUserId: string): Promise<void> {
    try {
      await apiClient.post('/billing/invoices/send-reminder', {
        invoiceId,
        tenantUserId,
        type: 'manual',
      });
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to send reminder');
    }
  },

  async generatePdf(invoiceId: string): Promise<{ html: string }> {
    try {
      const response = await apiClient.get(`/billing/invoices/${invoiceId}/pdf`);
      return response.data.data;
    } catch (error: any) {
      const apiError = error.response?.data?.error;
      throw new Error(apiError?.message || error.message || 'Failed to generate PDF');
    }
  }
};
