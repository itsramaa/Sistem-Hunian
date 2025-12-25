import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cron job to process eligible referral commissions
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing referral commissions...');

    // Get all eligible commissions that are due
    const { data: eligibleCommissions, error: fetchError } = await supabase
      .from('referral_commissions')
      .select(`
        *,
        referral:referrals(
          referee_user_id,
          referrer_user_id
        )
      `)
      .eq('status', 'eligible')
      .lte('eligible_date', new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${eligibleCommissions?.length || 0} eligible commissions`);

    const results = {
      processed: 0,
      paid: 0,
      cancelled: 0,
      errors: 0,
    };

    for (const commission of eligibleCommissions || []) {
      try {
        results.processed++;

        // Check if referee is still subscribed
        const { data: subscription } = await supabase
          .from('merchant_subscriptions')
          .select('status')
          .eq('merchant_id', commission.referee_id)
          .eq('status', 'active')
          .single();

        if (!subscription) {
          // Referee cancelled - cancel remaining commissions
          await supabase
            .from('referral_commissions')
            .update({
              status: 'cancelled',
              cancellation_reason: 'referee_unsubscribed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', commission.id);

          // Notify referrer
          await supabase
            .from('notifications')
            .insert({
              user_id: commission.referrer_id,
              type: 'commission_cancelled',
              title: 'Commission Stopped',
              message: `Your referral commission has ended because the referred user cancelled their subscription.`,
              link: '/merchant/referrals',
            });

          results.cancelled++;
          continue;
        }

        // Pay the commission - add to merchant's escrow
        const { data: merchant } = await supabase
          .from('merchants')
          .select('id')
          .eq('user_id', commission.referrer_id)
          .single();

        if (merchant) {
          // Get or create escrow account
          const { data: escrow } = await supabase
            .from('escrow_accounts')
            .select('id, balance')
            .eq('merchant_id', merchant.id)
            .single();

          if (escrow) {
            // Update escrow balance
            await supabase
              .from('escrow_accounts')
              .update({
                balance: escrow.balance + commission.commission_amount,
                updated_at: new Date().toISOString(),
              })
              .eq('id', escrow.id);

            // Create escrow transaction
            await supabase
              .from('escrow_transactions')
              .insert({
                escrow_account_id: escrow.id,
                type: 'credit',
                amount: commission.commission_amount,
                description: `Referral commission - Month ${commission.month_number}`,
                reference: `REF-COMM-${commission.id}`,
                status: 'completed',
                processed_at: new Date().toISOString(),
              });
          }
        }

        // Update commission as paid
        await supabase
          .from('referral_commissions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', commission.id);

        // Update referral_rewards record
        await supabase
          .from('referral_rewards')
          .update({
            status: 'credited',
            credited_at: new Date().toISOString(),
          })
          .eq('referral_id', commission.referral_id)
          .eq('user_id', commission.referrer_id)
          .eq('status', 'pending');

        // Notify referrer
        await supabase
          .from('notifications')
          .insert({
            user_id: commission.referrer_id,
            type: 'commission_paid',
            title: '💰 Commission Paid!',
            message: `Rp ${commission.commission_amount.toLocaleString()} referral commission (Month ${commission.month_number}/6) has been added to your balance.`,
            link: '/merchant/referrals',
          });

        results.paid++;

      } catch (commError) {
        console.error('Error processing commission:', commission.id, commError);
        results.errors++;
      }
    }

    console.log('Commission processing complete:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in commission processing:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
