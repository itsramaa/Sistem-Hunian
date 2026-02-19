import { supabase } from '@/lib/integrations/supabase/client';
import { Invoice } from '../types';

export const invoiceService = {
  async getTenantInvoices(tenantId: string, limit?: number): Promise<Invoice[]> {
    let query = supabase
      .from('invoices')
      .select('id, invoice_number, amount, total_amount, status, due_date, late_fee')
      .eq('tenant_user_id', tenantId)
      .in('status', ['pending', 'sent', 'overdue'])
      .order('due_date', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Invoice[];
  },

  async getAllTenantInvoices(tenantId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_user_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as Invoice[];
  },

  async downloadInvoicePdf(invoiceId: string): Promise<{ pdfUrl?: string; html?: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
      body: { invoiceId }
    });

    if (error) throw error;
    return data;
  }
};
