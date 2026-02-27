import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const XENDIT_WEBHOOK_TOKEN = Deno.env.get('XENDIT_WEBHOOK_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const callbackToken = req.headers.get('x-callback-token');
    if (XENDIT_WEBHOOK_TOKEN && callbackToken !== XENDIT_WEBHOOK_TOKEN) {
      console.error('Invalid webhook token');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload = await req.json();

    console.log('Received Xendit disbursement webhook:', JSON.stringify(payload, null, 2));

    const {
      id: xenditDisbursementId,
      external_id: externalId,
      status,
      failure_code: failureCode,
    } = payload;

    // Find the disbursement record
    let disbursement = null;
    
    const { data: disbursementById } = await supabase
      .from('disbursements')
      .select('*')
      .eq('xendit_disbursement_id', xenditDisbursementId)
      .single();

    if (disbursementById) {
      disbursement = disbursementById;
    } else {
      const { data: disbursementByRef } = await supabase
        .from('disbursements')
        .select('*')
        .eq('xendit_reference', externalId)
        .single();
      disbursement = disbursementByRef;
    }

    if (!disbursement) {
      console.error('Disbursement not found:', xenditDisbursementId, externalId);
      return new Response(JSON.stringify({ error: 'Disbursement not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // Check if this disbursement is linked to a payment_transfer
    const { data: paymentTransfer } = await supabase
      .from('payment_transfers')
      .select('id, merchant_id')
      .eq('xendit_disbursement_id', xenditDisbursementId)
      .maybeSingle();

    // Get merchant info — from payment_transfer or vendor
    let merchantUserId: string | null = null;
    let merchantBusinessName: string | null = null;

    if (paymentTransfer) {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('user_id, business_name, total_disbursed')
        .eq('id', paymentTransfer.merchant_id)
        .single();
      merchantUserId = merchant?.user_id || null;
      merchantBusinessName = merchant?.business_name || null;

      if (status === 'COMPLETED' && merchant) {
        // Update merchant stats
        await supabase
          .from('merchants')
          .update({
            total_disbursed: (merchant.total_disbursed || 0) + disbursement.net_amount,
            last_disbursement_date: now,
          })
          .eq('id', paymentTransfer.merchant_id);
      }
    } else if (disbursement.vendor_id) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('user_id, business_name')
        .eq('id', disbursement.vendor_id)
        .single();
      merchantUserId = vendor?.user_id || null;
      merchantBusinessName = vendor?.business_name || null;
    }

    const { data: bankAccount } = await supabase
      .from('bank_accounts')
      .select('bank_name, account_number, account_name')
      .eq('id', disbursement.bank_account_id)
      .maybeSingle();

    console.log(`Processing disbursement ${disbursement.id} with status: ${status}`);

    if (status === 'COMPLETED') {
      // Update disbursement status
      await supabase
        .from('disbursements')
        .update({ status: 'completed', completed_at: now, processed_at: now })
        .eq('id', disbursement.id);

      // Update payment_transfer if linked
      if (paymentTransfer) {
        await supabase
          .from('payment_transfers')
          .update({ status: 'completed', completed_at: now })
          .eq('id', paymentTransfer.id);
      }

      // Notify
      if (merchantUserId) {
        await supabase.from('notifications').insert({
          user_id: merchantUserId,
          title: 'Transfer Dana Berhasil',
          message: `Dana sebesar Rp ${disbursement.net_amount.toLocaleString()} telah ditransfer ke rekening bank Anda.`,
          type: 'payment',
          link: '/merchant/payments',
        });
      }

      console.log(`Disbursement ${disbursement.id} completed successfully`);

    } else if (status === 'FAILED') {
      await supabase
        .from('disbursements')
        .update({ status: 'failed', failure_reason: failureCode || 'Unknown error' })
        .eq('id', disbursement.id);

      // Update payment_transfer if linked
      if (paymentTransfer) {
        await supabase
          .from('payment_transfers')
          .update({ status: 'failed', failure_reason: failureCode || 'Unknown error' })
          .eq('id', paymentTransfer.id);
      }

      if (merchantUserId) {
        await supabase.from('notifications').insert({
          user_id: merchantUserId,
          title: 'Transfer Dana Gagal',
          message: `Transfer dana sebesar Rp ${disbursement.amount.toLocaleString()} gagal. Alasan: ${failureCode || 'Unknown error'}. Silakan periksa detail rekening bank Anda.`,
          type: 'payment',
          link: '/merchant/settings',
        });
      }

      console.log(`Disbursement ${disbursement.id} failed: ${failureCode}`);
    }

    return new Response(
      JSON.stringify({ success: true, status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
