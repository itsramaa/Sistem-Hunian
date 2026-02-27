import { supabase } from '@/integrations/supabase/client';

export interface PaymentMatch {
  id: string;
  paymentId: string;
  invoiceId: string;
  merchantId: string;
  matchedAmount: number;
  matchType: string;
  matchConfidence: number;
  matchReason: string | null;
  createdAt: string;
}

export interface UnmatchedPayment {
  id: string;
  contractId: string;
  tenantUserId: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  reference: string | null;
  status: string;
  reconciliationStatus: string;
  paidAt: string | null;
  createdAt: string;
  proofPhotoUrl: string | null;
  // Joined data
  tenantName?: string;
  unitNumber?: string;
  suggestedInvoices?: SuggestedInvoice[];
  flags?: string[];
}

export interface SuggestedInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  status: string;
}

export const reconciliationService = {
  async fetchUnmatchedPayments(merchantId: string): Promise<UnmatchedPayment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('merchant_id', merchantId)
      .in('reconciliation_status', ['unmatched', 'pending_review'])
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For each unmatched payment, find suggested invoices
    const results: UnmatchedPayment[] = [];
    for (const p of data || []) {
      // Get tenant name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', p.tenant_user_id)
        .single();

      // Get suggested invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, due_date, status')
        .eq('merchant_id', merchantId)
        .eq('contract_id', p.contract_id)
        .eq('tenant_user_id', p.tenant_user_id)
        .in('status', ['sent', 'overdue', 'escalated', 'partially_paid'])
        .order('due_date', { ascending: true })
        .limit(3);

      // Detect flags
      const flags: string[] = [];
      const suggestedInvs = (invoices || []).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        totalAmount: Number(inv.total_amount),
        dueDate: inv.due_date,
        status: inv.status,
      }));
      // Check partial
      if (suggestedInvs.length > 0 && suggestedInvs[0].totalAmount > Number(p.amount)) flags.push('partial');
      if (suggestedInvs.length > 0 && suggestedInvs[0].totalAmount < Number(p.amount)) flags.push('overpayment');
      // Check duplicate (same amount+tenant in same batch)
      const dupeCount = (data || []).filter(
        d => d.tenant_user_id === p.tenant_user_id && Number(d.amount) === Number(p.amount) && d.id !== p.id
      ).length;
      if (dupeCount > 0) flags.push('duplicate');

      results.push({
        id: p.id,
        contractId: p.contract_id,
        tenantUserId: p.tenant_user_id,
        amount: Number(p.amount),
        paymentType: p.payment_type || '',
        paymentMethod: p.payment_method || '',
        reference: p.reference,
        status: p.status,
        reconciliationStatus: p.reconciliation_status,
        paidAt: p.paid_at,
        createdAt: p.created_at,
        proofPhotoUrl: p.proof_photo_url,
        tenantName: profile?.full_name || 'N/A',
        suggestedInvoices: suggestedInvs,
        flags,
      });
    }

    return results;
  },

  async manualMatch(paymentId: string, invoiceId: string, merchantId: string, amount: number) {
    // Create match record
    const { error: matchErr } = await supabase.from('payment_invoice_match').insert({
      payment_id: paymentId,
      invoice_id: invoiceId,
      merchant_id: merchantId,
      matched_amount: amount,
      match_type: 'manual',
      match_confidence: 1.0,
      match_reason: 'Manually matched by merchant',
    });
    if (matchErr) throw matchErr;

    // Update payment
    const { error: payErr } = await supabase
      .from('payments')
      .update({ reconciliation_status: 'manually_matched' })
      .eq('id', paymentId);
    if (payErr) throw payErr;

    // Update invoice status
    const { data: invoice } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('id', invoiceId)
      .single();

    if (invoice && amount >= Number(invoice.total_amount)) {
      await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', invoiceId);
    } else {
      await supabase
        .from('invoices')
        .update({ status: 'partially_paid' })
        .eq('id', invoiceId)
        .in('status', ['sent', 'overdue', 'escalated']);
    }
  },

  async triggerAutoMatch(paymentId: string, merchantId: string) {
    const { error } = await supabase.functions.invoke('auto-match-payment', {
      body: { paymentId, merchantId },
    });
    if (error) throw error;
  },

  async fetchMatchHistory(merchantId: string): Promise<PaymentMatch[]> {
    const { data, error } = await supabase
      .from('payment_invoice_match')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map(m => ({
      id: m.id,
      paymentId: m.payment_id,
      invoiceId: m.invoice_id,
      merchantId: m.merchant_id,
      matchedAmount: Number(m.matched_amount),
      matchType: m.match_type,
      matchConfidence: Number(m.match_confidence),
      matchReason: m.match_reason,
      createdAt: m.created_at,
    }));
  },
};
