import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { paymentId, merchantId } = await req.json();

    if (!paymentId || !merchantId) {
      return new Response(JSON.stringify({ error: 'paymentId and merchantId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the payment
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (payErr || !payment) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find candidate invoices for this tenant+contract
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('contract_id', payment.contract_id)
      .eq('tenant_user_id', payment.tenant_user_id)
      .in('status', ['sent', 'overdue', 'escalated', 'partially_paid'])
      .order('due_date', { ascending: true });

    if (!invoices || invoices.length === 0) {
      // No matching invoices — mark for manual review
      await supabase
        .from('payments')
        .update({ reconciliation_status: 'pending_review' })
        .eq('id', paymentId);

      return new Response(JSON.stringify({ 
        matched: false, 
        tier: 3, 
        reason: 'No outstanding invoices found for this tenant/contract' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentAmount = Number(payment.amount);
    let matched = false;
    let tier = 3;
    let matchedInvoiceId: string | null = null;
    let matchReason = '';

    // TIER 1: Exact match (amount = invoice total_amount, same due_date)
    for (const inv of invoices) {
      if (Number(inv.total_amount) === paymentAmount) {
        // Exact match!
        matchedInvoiceId = inv.id;
        tier = 1;
        matchReason = `Exact amount match: Rp ${paymentAmount} = invoice ${inv.invoice_number}`;
        matched = true;
        break;
      }
    }

    // TIER 2: Partial or overpayment — match to oldest overdue
    if (!matched) {
      const oldestInvoice = invoices[0]; // sorted by due_date ASC
      
      if (paymentAmount < Number(oldestInvoice.total_amount)) {
        // Partial payment
        matchedInvoiceId = oldestInvoice.id;
        tier = 2;
        matchReason = `Partial payment: Rp ${paymentAmount} of Rp ${oldestInvoice.total_amount} for ${oldestInvoice.invoice_number}`;
        matched = true;
      } else if (paymentAmount > Number(oldestInvoice.total_amount)) {
        // Overpayment — match to oldest, note the surplus
        matchedInvoiceId = oldestInvoice.id;
        tier = 2;
        const surplus = paymentAmount - Number(oldestInvoice.total_amount);
        matchReason = `Overpayment: Rp ${paymentAmount} for ${oldestInvoice.invoice_number} (surplus Rp ${surplus})`;
        matched = true;
      }
    }

    if (matched && matchedInvoiceId) {
      const confidence = tier === 1 ? 1.0 : 0.7;

      // Create match record
      await supabase.from('payment_invoice_match').insert({
        payment_id: paymentId,
        invoice_id: matchedInvoiceId,
        merchant_id: merchantId,
        matched_amount: paymentAmount,
        match_type: tier === 1 ? 'auto_exact' : 'auto_partial',
        match_confidence: confidence,
        match_reason: matchReason,
      });

      // Update payment reconciliation status
      const reconStatus = tier === 1 ? 'auto_matched' : 'pending_review';
      await supabase
        .from('payments')
        .update({ reconciliation_status: reconStatus })
        .eq('id', paymentId);

      // For Tier 1 exact match with paid status, also update invoice
      if (tier === 1 && payment.status === 'paid') {
        await supabase
          .from('invoices')
          .update({ status: 'paid', paid_at: payment.paid_at || new Date().toISOString() })
          .eq('id', matchedInvoiceId);
      }

      // For Tier 2 partial, mark invoice as partially_paid
      if (tier === 2 && paymentAmount < Number(invoices.find(i => i.id === matchedInvoiceId)?.total_amount || 0)) {
        await supabase
          .from('invoices')
          .update({ status: 'partially_paid' })
          .eq('id', matchedInvoiceId)
          .in('status', ['sent', 'overdue', 'escalated']);
      }
    } else {
      // TIER 3: No match possible
      await supabase
        .from('payments')
        .update({ reconciliation_status: 'pending_review' })
        .eq('id', paymentId);
      matchReason = 'No matching invoice found — manual review required';
    }

    return new Response(JSON.stringify({ 
      matched, 
      tier, 
      reason: matchReason,
      invoiceId: matchedInvoiceId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
