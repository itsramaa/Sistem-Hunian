import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const XENDIT_WEBHOOK_TOKEN = Deno.env.get('XENDIT_WEBHOOK_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Verify webhook token
    const callbackToken = req.headers.get('x-callback-token');
    if (callbackToken !== XENDIT_WEBHOOK_TOKEN) {
      console.error('Invalid webhook token');
      return new Response(
        JSON.stringify({ error: 'Invalid callback token' }),
        { headers: corsHeaders, status: 401 }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const payload = await req.json();

    console.log('Xendit webhook received:', payload);

    const { id, external_id, status, payment_method, payment_channel, paid_at, paid_amount } = payload;

    // Map Xendit status to our status
    let mappedStatus = 'pending';
    if (status === 'PAID' || status === 'SETTLED') {
      mappedStatus = 'paid';
    } else if (status === 'EXPIRED') {
      mappedStatus = 'expired';
    } else if (status === 'FAILED') {
      mappedStatus = 'failed';
    }

    // Update transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('xendit_transactions')
      .update({
        status: mappedStatus,
        payment_method,
        payment_channel,
        paid_at: paid_at ? new Date(paid_at).toISOString() : null,
        callback_data: payload,
      })
      .eq('xendit_invoice_id', id)
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction update error:', transactionError);
      throw new Error(`Database error: ${transactionError.message}`);
    }

    console.log('Transaction updated:', transaction);

    // If payment is successful, update the related payment/invoice/order
    if (mappedStatus === 'paid') {
      // Update payment record if exists
      if (transaction.payment_id) {
        await supabase
          .from('payments')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: payment_channel || payment_method,
            reference: external_id,
          })
          .eq('id', transaction.payment_id);
        console.log('Payment record updated');
      }

      // Update invoice record if exists
      if (transaction.invoice_id) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', transaction.invoice_id);
        console.log('Invoice record updated');
      }

      // Update order record if exists
      if (transaction.order_id) {
        await supabase
          .from('orders')
          .update({
            status: 'confirmed',
          })
          .eq('id', transaction.order_id);
        console.log('Order record updated');
      }

      // Create escrow transaction for rent payments
      if (transaction.payment_id) {
        const { data: payment } = await supabase
          .from('payments')
          .select('merchant_id, amount, contract_id')
          .eq('id', transaction.payment_id)
          .single();

        if (payment) {
          const { data: escrowAccount } = await supabase
            .from('escrow_accounts')
            .select('id')
            .eq('merchant_id', payment.merchant_id)
            .single();

          if (escrowAccount) {
            await supabase.from('escrow_transactions').insert({
              escrow_account_id: escrowAccount.id,
              amount: payment.amount,
              type: 'deposit',
              status: 'completed',
              description: `Rent payment received`,
              contract_id: payment.contract_id,
              reference: external_id,
              processed_at: new Date().toISOString(),
            });

            // Update escrow balance
            // Update escrow balance directly
            const { data: currentEscrow } = await supabase
              .from('escrow_accounts')
              .select('balance')
              .eq('id', escrowAccount.id)
              .single();

            if (currentEscrow) {
              await supabase
                .from('escrow_accounts')
                .update({ balance: currentEscrow.balance + payment.amount })
                .eq('id', escrowAccount.id);
            }

            console.log('Escrow transaction created');
          }
        }
      }

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: transaction.user_id,
        title: 'Payment Successful',
        message: `Your payment of Rp ${paid_amount?.toLocaleString() || transaction.amount.toLocaleString()} has been confirmed.`,
        type: 'payment',
        link: '/tenant/payments',
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
