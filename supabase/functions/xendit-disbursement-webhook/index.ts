import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const XENDIT_WEBHOOK_TOKEN = Deno.env.get('XENDIT_WEBHOOK_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify webhook token
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

    // Xendit disbursement webhook structure
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
      // Try finding by xendit_reference (external_id)
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

    // Get related data
    const { data: escrowAccount } = await supabase
      .from('escrow_accounts')
      .select('*, merchants:merchant_id(id, user_id, business_name, total_disbursed)')
      .eq('id', disbursement.escrow_account_id)
      .single();

    const { data: bankAccount } = await supabase
      .from('bank_accounts')
      .select('bank_name, account_number, account_name')
      .eq('id', disbursement.bank_account_id)
      .single();

    const merchant = escrowAccount?.merchants;
    const now = new Date().toISOString();

    console.log(`Processing disbursement ${disbursement.id} with status: ${status}`);

    if (status === 'COMPLETED') {
      // Update disbursement status
      await supabase
        .from('disbursements')
        .update({
          status: 'completed',
          completed_at: now,
          processed_at: now,
        })
        .eq('id', disbursement.id);

      // Update escrow account - clear pending balance
      if (escrowAccount) {
        const newPendingBalance = Math.max(0, (escrowAccount.pending_balance || 0) - disbursement.amount);
        await supabase
          .from('escrow_accounts')
          .update({ pending_balance: newPendingBalance })
          .eq('id', escrowAccount.id);

        // Update escrow transaction status
        await supabase
          .from('escrow_transactions')
          .update({ 
            status: 'completed',
            processed_at: now 
          })
          .eq('reference', disbursement.id);
      }

      // Update merchant stats
      if (merchant) {
        const newTotalDisbursed = (merchant.total_disbursed || 0) + disbursement.net_amount;
        await supabase
          .from('merchants')
          .update({
            total_disbursed: newTotalDisbursed,
            last_disbursement_date: now,
          })
          .eq('id', merchant.id);

        // Create success notification
        await supabase.from('notifications').insert({
          user_id: merchant.user_id,
          title: 'Disbursement Completed',
          message: `Your disbursement of Rp ${disbursement.net_amount.toLocaleString()} has been transferred to your bank account.`,
          type: 'payment',
          link: '/merchant/escrow',
        });

        // Send success email
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'disbursement_success',
              recipientEmail: '',
              recipientName: merchant.business_name,
              data: {
                amount: disbursement.net_amount,
                bankName: bankAccount?.bank_name || 'Bank',
                accountName: bankAccount?.account_name || '',
                accountNumber: bankAccount?.account_number || '',
                reference: disbursement.xendit_reference || disbursement.id,
                completedAt: new Date().toLocaleDateString('id-ID'),
                dashboardLink: `${SUPABASE_URL?.replace('.supabase.co', '.lovable.app')}/merchant/escrow`,
              },
            },
          });
        } catch (emailError) {
          console.error('Failed to send success email:', emailError);
        }
      }

      console.log(`Disbursement ${disbursement.id} completed successfully`);

    } else if (status === 'FAILED') {
      // Update disbursement status
      await supabase
        .from('disbursements')
        .update({
          status: 'failed',
          failure_reason: failureCode || 'Unknown error',
        })
        .eq('id', disbursement.id);

      // Rollback escrow balance
      if (escrowAccount) {
        const newBalance = (escrowAccount.balance || 0) + disbursement.amount;
        const newPendingBalance = Math.max(0, (escrowAccount.pending_balance || 0) - disbursement.amount);
        
        await supabase
          .from('escrow_accounts')
          .update({
            balance: newBalance,
            pending_balance: newPendingBalance,
          })
          .eq('id', escrowAccount.id);

        // Update escrow transaction status
        await supabase
          .from('escrow_transactions')
          .update({ 
            status: 'failed',
            description: `Disbursement failed: ${failureCode || 'Unknown error'}` 
          })
          .eq('reference', disbursement.id);
      }

      // Create failure notification
      if (merchant) {
        await supabase.from('notifications').insert({
          user_id: merchant.user_id,
          title: 'Disbursement Failed',
          message: `Your disbursement of Rp ${disbursement.amount.toLocaleString()} failed. Reason: ${failureCode || 'Unknown error'}. Your funds have been returned to your escrow balance.`,
          type: 'payment',
          link: '/merchant/escrow',
        });

        // Send failure email
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'disbursement_failed',
              recipientEmail: '',
              recipientName: merchant.business_name,
              data: {
                amount: disbursement.amount,
                bankName: bankAccount?.bank_name || 'Bank',
                reference: disbursement.xendit_reference || disbursement.id,
                failureReason: failureCode || 'Unknown error',
                settingsLink: `${SUPABASE_URL?.replace('.supabase.co', '.lovable.app')}/merchant/settings`,
              },
            },
          });
        } catch (emailError) {
          console.error('Failed to send failure email:', emailError);
        }
      }

      console.log(`Disbursement ${disbursement.id} failed: ${failureCode}`);
    }

    return new Response(
      JSON.stringify({ success: true, status }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
