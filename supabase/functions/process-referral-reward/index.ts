import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReferralRewardRequest {
  event_type: 'subscription_paid' | 'rent_paid' | 'order_completed' | 'consecutive_payments';
  user_id: string;
  amount?: number;
  subscription_tier?: string;
  order_count?: number;
  avg_rating?: number;
  consecutive_months?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ReferralRewardRequest = await req.json();
    const { event_type, user_id, amount, subscription_tier, order_count, avg_rating, consecutive_months } = body;

    console.log('Processing referral reward:', { event_type, user_id });

    // Find if user was referred
    const { data: referral, error: refError } = await supabase
      .from('referrals')
      .select('*, referrer:profiles!referrals_referrer_user_id_fkey(full_name, email)')
      .eq('referee_user_id', user_id)
      .single();

    if (refError || !referral) {
      console.log('No referral found for user:', user_id);
      return new Response(JSON.stringify({ success: true, message: 'No referral found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const referrerId = referral.referrer_user_id;
    const referrerRole = referral.referrer_role;

    // Process based on event type and referrer role
    switch (event_type) {
      case 'subscription_paid': {
        // Merchant referral: 20% commission for 6 months
        if (referrerRole === 'merchant' && amount && amount > 0) {
          const commissionRate = 0.20;
          const commissionAmount = amount * commissionRate;

          // Check if this is first payment (conversion)
          if (!referral.converted_at) {
            // Update referral to converted
            await supabase
              .from('referrals')
              .update({
                status: 'converted',
                converted_at: new Date().toISOString(),
                referee_subscription_tier: subscription_tier,
                referee_monthly_payment: amount,
              })
              .eq('id', referral.id);

            // Create first commission record
            await supabase
              .from('referral_commissions')
              .insert({
                referral_id: referral.id,
                referrer_id: referrerId,
                referee_id: user_id,
                month_number: 1,
                subscription_amount: amount,
                commission_rate: commissionRate,
                commission_amount: commissionAmount,
                status: 'eligible',
                eligible_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              });

            // Notify referrer
            await supabase
              .from('notifications')
              .insert({
                user_id: referrerId,
                type: 'referral_converted',
                title: '🎉 Referral Converted!',
                message: `Your referral upgraded to ${subscription_tier}! You'll earn Rp ${commissionAmount.toLocaleString()}/month for 6 months.`,
                link: '/merchant/referrals',
              });

            // Create referral reward record
            await supabase
              .from('referral_rewards')
              .insert({
                user_id: referrerId,
                referral_id: referral.id,
                type: 'commission',
                amount: commissionAmount,
                status: 'pending',
              });
          } else {
            // Subsequent payment - create next month's commission
            const { data: existingCommissions } = await supabase
              .from('referral_commissions')
              .select('month_number')
              .eq('referral_id', referral.id)
              .order('month_number', { ascending: false })
              .limit(1);

            const nextMonth = (existingCommissions?.[0]?.month_number || 0) + 1;

            if (nextMonth <= 6) {
              await supabase
                .from('referral_commissions')
                .insert({
                  referral_id: referral.id,
                  referrer_id: referrerId,
                  referee_id: user_id,
                  month_number: nextMonth,
                  subscription_amount: amount,
                  commission_rate: commissionRate,
                  commission_amount: commissionAmount,
                  status: 'eligible',
                  eligible_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                });
            }
          }
        }
        break;
      }

      case 'rent_paid': {
        // Tenant referral: Rp 25k voucher on first rent payment (min 500k)
        if (referrerRole === 'tenant' && amount && amount >= 500000 && !referral.first_payment_at) {
          // Update referral with first payment
          await supabase
            .from('referrals')
            .update({
              status: 'reward_earned',
              first_payment_at: new Date().toISOString(),
            })
            .eq('id', referral.id);

          // Generate voucher code
          const voucherCode = `VCHR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          
          // Create voucher for referrer
          await supabase
            .from('vouchers')
            .insert({
              owner_id: referrerId,
              code: voucherCode,
              discount_type: 'fixed',
              discount_value: 25000,
              min_order: 0,
              valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
              applicable_to: 'marketplace_orders',
              referral_id: referral.id,
            });

          // Notify referrer
          await supabase
            .from('notifications')
            .insert({
              user_id: referrerId,
              type: 'referral_voucher',
              title: '🎁 Voucher Reward!',
              message: `Your referral paid their first rent! You earned a Rp 25,000 voucher. Code: ${voucherCode}`,
              link: '/tenant/referrals',
            });

          // Create referral reward record
          await supabase
            .from('referral_rewards')
            .insert({
              user_id: referrerId,
              referral_id: referral.id,
              type: 'voucher',
              amount: 25000,
              status: 'credited',
            });
        }
        break;
      }

      case 'consecutive_payments': {
        // Tenant bonus: Additional Rp 25k voucher after 3 consecutive rent payments
        if (referrerRole === 'tenant' && consecutive_months && consecutive_months >= 3 && !referral.bonus_paid) {
          const voucherCode = `BONUS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          
          // Create bonus voucher
          await supabase
            .from('vouchers')
            .insert({
              owner_id: referrerId,
              code: voucherCode,
              discount_type: 'fixed',
              discount_value: 25000,
              min_order: 0,
              valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              applicable_to: 'marketplace_orders',
              referral_id: referral.id,
            });

          // Update referral bonus status
          await supabase
            .from('referrals')
            .update({
              bonus_paid: true,
              bonus_paid_at: new Date().toISOString(),
            })
            .eq('id', referral.id);

          // Notify referrer
          await supabase
            .from('notifications')
            .insert({
              user_id: referrerId,
              type: 'referral_bonus',
              title: '🎉 Bonus Voucher!',
              message: `Your referral paid 3 consecutive months! Bonus Rp 25,000 voucher. Code: ${voucherCode}`,
              link: '/tenant/referrals',
            });

          // Create bonus reward record
          await supabase
            .from('referral_rewards')
            .insert({
              user_id: referrerId,
              referral_id: referral.id,
              type: 'bonus_voucher',
              amount: 25000,
              status: 'credited',
            });
        }
        break;
      }

      case 'order_completed': {
        // Vendor referral: Rp 50k cashback after 10 completed orders with avg rating >= 4.0
        if (referrerRole === 'vendor' && order_count && avg_rating) {
          // Update order stats
          await supabase
            .from('referrals')
            .update({
              referee_order_count: order_count,
              referee_avg_rating: avg_rating,
            })
            .eq('id', referral.id);

          // Check if milestone reached (10 orders, rating >= 4.0)
          if (order_count >= 10 && avg_rating >= 4.0 && referral.status !== 'cashback_tier1') {
            // Update referral status
            await supabase
              .from('referrals')
              .update({
                status: 'cashback_tier1',
                converted_at: new Date().toISOString(),
              })
              .eq('id', referral.id);

            // Add cashback to vendor earnings
            await supabase
              .from('vendors')
              .update({
                referral_earnings: 50000,
              })
              .eq('user_id', referrerId);

            // Notify referrer
            await supabase
              .from('notifications')
              .insert({
                user_id: referrerId,
                type: 'referral_cashback',
                title: '💰 Cashback Earned!',
                message: 'Your referral completed 10 orders with great ratings! You earned Rp 50,000 cashback.',
                link: '/vendor/referrals',
              });

            // Create reward record
            await supabase
              .from('referral_rewards')
              .insert({
                user_id: referrerId,
                referral_id: referral.id,
                type: 'cashback',
                amount: 50000,
                status: 'credited',
              });
          }

          // Check for bonus milestone (50 orders, 3 months active)
          // This would be checked separately by a cron job based on vendor activity
        }
        break;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing referral reward:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
