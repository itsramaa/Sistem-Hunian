import { supabase } from '@/lib/integrations/supabase/client';

export interface CreateXenditInvoicePayload {
  payment_id?: string;
  invoice_id?: string;
  order_id?: string;
  amount: number;
  description: string;
  payer_email: string;
  payer_name: string;
  user_id: string;
  payment_type: 'rent' | 'invoice' | 'order';
  preferred_method?: string;
}

export interface XenditInvoiceResponse {
  success: boolean;
  payment_url: string;
  error?: string;
  external_id?: string;
  status?: string;
  merchant_name?: string;
  merchant_profile_picture_url?: string;
  amount?: number;
  expiry_date?: string;
  invoice_url?: string;
  available_banks?: Array<{
    bank_code: string;
    collection_type: string;
    transfer_amount: number;
    bank_branch: string;
    account_holder_name: string;
  }>;
  available_retail_outlets?: Array<{
    retail_outlet_name: string;
  }>;
  available_ewallets?: Array<{
    ewallet_type: string;
  }>;
  available_qr_codes?: Array<{
    qr_code_type: string;
  }>;
  available_direct_debits?: Array<{
    direct_debit_type: string;
  }>;
  available_paylaters?: Array<{
    paylater_type: string;
  }>;
  should_exclude_credit_card?: boolean;
  should_send_email?: boolean;
  created?: string;
  updated?: string;
  currency?: string;
}

export const xenditService = {
  async createInvoice(payload: CreateXenditInvoicePayload): Promise<XenditInvoiceResponse> {
    const { data, error } = await supabase.functions.invoke('xendit-create-invoice', {
      body: payload,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to create invoice');
    return data;
  }
};
