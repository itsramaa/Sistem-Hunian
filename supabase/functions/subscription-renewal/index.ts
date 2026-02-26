import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('Running subscription renewal check...');

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const results = {
      expiredTrials: 0,
      expiredSubscriptions: 0,
      scheduledCancellations: 0,
      pendingChangesApplied: 0,
      reminders7Days: 0,
      reminders3Days: 0,
      reminders1Day: 0,
    };

    // ===== STEP 1: Handle Scheduled Cancellations =====
    console.log('Checking for scheduled cancellations...');
    
    const { data: scheduledCancellations, error: cancelError } = await supabase
      .from('merchant_subscriptions')
      .select(`
        *,
        merchants!inner(id, user_id, business_name)
      `)
      .not('cancellation_effective_date', 'is', null)
      .lte('cancellation_effective_date', now.toISOString())
      .eq('status', 'active');

    if (cancelError) {
      console.error('Error fetching scheduled cancellations:', cancelError);
    } else {
      console.log(`Found ${scheduledCancellations?.length || 0} scheduled cancellations to process`);

      for (const sub of scheduledCancellations || []) {
        console.log(`Processing scheduled cancellation for merchant ${sub.merchant_id}`);

        // Get free tier
        const { data: freeTier } = await supabase
          .from('subscription_tiers')
          .select('id')
          .eq('name', 'free')
          .maybeSingle();

        if (freeTier) {
          // Downgrade to free tier and mark as cancelled
          await supabase
            .from('merchant_subscriptions')
            .update({
              tier_id: freeTier.id,
              status: 'cancelled',
              canceled_at: now.toISOString(),
            })
            .eq('id', sub.id);

          // Notify merchant
          await supabase.from('notifications').insert({
            user_id: sub.merchants.user_id,
            title: 'Subscription Cancelled',
            message: `Your subscription has been cancelled as scheduled. You've been moved to the Free plan.`,
            type: 'subscription',
            link: '/merchant/settings',
          });

          results.scheduledCancellations++;
        }
      }
    }

    // ===== STEP 2: Handle Pending Subscription Changes =====
    console.log('Checking for pending subscription changes...');

    const { data: pendingChanges, error: pendingError } = await supabase
      .from('subscription_changes')
      .select(`
        *,
        merchants!inner(id, user_id, business_name),
        to_tier:subscription_tiers!subscription_changes_to_tier_id_fkey(id, name, display_name)
      `)
      .eq('status', 'pending')
      .lte('effective_date', now.toISOString());

    if (pendingError) {
      console.error('Error fetching pending changes:', pendingError);
    } else {
      console.log(`Found ${pendingChanges?.length || 0} pending changes to apply`);

      for (const change of pendingChanges || []) {
        console.log(`Applying pending change for merchant ${change.merchant_id}: ${change.change_type}`);

        // Update subscription to new tier
        const { error: updateError } = await supabase
          .from('merchant_subscriptions')
          .update({
            tier_id: change.to_tier_id,
            current_period_start: now.toISOString(),
            current_period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('merchant_id', change.merchant_id);

        if (!updateError) {
          // Mark pending change as applied
          await supabase
            .from('subscription_changes')
            .update({
              status: 'applied',
              applied_at: now.toISOString(),
            })
            .eq('id', change.id);

          // Notify merchant
          await supabase.from('notifications').insert({
            user_id: change.merchants.user_id,
            title: 'Subscription Plan Changed',
            message: `Your subscription has been changed to ${change.to_tier?.display_name || 'new plan'} as scheduled.`,
            type: 'subscription',
            link: '/merchant/settings',
          });

          results.pendingChangesApplied++;
        } else {
          console.error(`Error applying pending change ${change.id}:`, updateError);
        }
      }
    }

    // ===== STEP 3: Handle Trial Expirations and Renewals =====
    console.log('Checking for trial expirations and renewals...');

    const { data: subscriptions, error } = await supabase
      .from('merchant_subscriptions')
      .select(`
        *,
        merchants!inner(id, user_id, business_name),
        subscription_tiers!inner(id, name, price_monthly)
      `)
      .in('status', ['trialing', 'active'])
      .is('cancellation_effective_date', null); // Skip subscriptions with scheduled cancellation

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }

    console.log(`Found ${subscriptions?.length || 0} active subscriptions to check`);

    for (const sub of subscriptions || []) {
      const trialEnds = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
      const periodEnds = new Date(sub.current_period_end);
      const merchantUserId = sub.merchants.user_id;

      // Handle trial subscriptions
      if (sub.status === 'trialing' && trialEnds) {
        // Trial expired
        if (trialEnds < now) {
          console.log(`Trial expired for merchant ${sub.merchant_id}`);
          
          // Get free tier
          const { data: freeTier } = await supabase
            .from('subscription_tiers')
            .select('id')
            .eq('name', 'free')
            .maybeSingle();

          if (freeTier) {
            // Downgrade to free tier
            await supabase
              .from('merchant_subscriptions')
              .update({
                tier_id: freeTier.id,
                status: 'active',
                trial_ends_at: null,
                current_period_start: now.toISOString(),
                current_period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              })
              .eq('id', sub.id);

            // Notify merchant
            await supabase.from('notifications').insert({
              user_id: merchantUserId,
              title: 'Trial Period Ended',
              message: `Your trial period has ended. You've been downgraded to the Free plan. Upgrade to continue enjoying premium features.`,
              type: 'subscription',
              link: '/merchant/settings',
            });

            results.expiredTrials++;
          }
        }
        // Trial ending in 7 days
        else if (trialEnds <= sevenDaysFromNow && trialEnds > threeDaysFromNow) {
          await supabase.from('notifications').insert({
            user_id: merchantUserId,
            title: 'Trial Ending Soon',
            message: `Your trial period ends in 7 days. Upgrade now to keep your premium features!`,
            type: 'subscription',
            link: '/merchant/settings',
          });
          results.reminders7Days++;
        }
        // Trial ending in 3 days
        else if (trialEnds <= threeDaysFromNow && trialEnds > oneDayFromNow) {
          await supabase.from('notifications').insert({
            user_id: merchantUserId,
            title: 'Trial Ending in 3 Days',
            message: `Only 3 days left in your trial! Upgrade to continue using premium features.`,
            type: 'subscription',
            link: '/merchant/settings',
          });
          results.reminders3Days++;
        }
        // Trial ending tomorrow
        else if (trialEnds <= oneDayFromNow && trialEnds > now) {
          await supabase.from('notifications').insert({
            user_id: merchantUserId,
            title: 'Trial Ends Tomorrow!',
            message: `Your trial period ends tomorrow! Upgrade now to avoid losing access to premium features.`,
            type: 'subscription',
            link: '/merchant/settings',
          });
          results.reminders1Day++;
        }
      }

      // Handle active paid subscriptions
      if (sub.status === 'active' && sub.subscription_tiers.price_monthly > 0) {
        // Subscription period expired
        if (periodEnds < now) {
          console.log(`Subscription period expired for merchant ${sub.merchant_id}`);

          // Get free tier for downgrade
          const { data: freeTier } = await supabase
            .from('subscription_tiers')
            .select('id')
            .eq('name', 'free')
            .maybeSingle();

          if (freeTier) {
            // Downgrade to free tier
            await supabase
              .from('merchant_subscriptions')
              .update({
                tier_id: freeTier.id,
                payment_status: 'expired',
              })
              .eq('id', sub.id);

            await supabase.from('notifications').insert({
              user_id: merchantUserId,
              title: 'Subscription Expired',
              message: `Your subscription has expired. You've been downgraded to the Free plan. Renew to continue using premium features.`,
              type: 'subscription',
              link: '/merchant/settings',
            });

            results.expiredSubscriptions++;
          }
        }
        // Subscription ending in 7 days
        else if (periodEnds <= sevenDaysFromNow && periodEnds > threeDaysFromNow) {
          await supabase.from('notifications').insert({
            user_id: merchantUserId,
            title: 'Subscription Renewal Reminder',
            message: `Your subscription renews in 7 days. Make sure your payment method is up to date.`,
            type: 'subscription',
            link: '/merchant/settings',
          });
          results.reminders7Days++;
        }
      }
    }

    console.log('Subscription renewal results:', results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in subscription renewal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
