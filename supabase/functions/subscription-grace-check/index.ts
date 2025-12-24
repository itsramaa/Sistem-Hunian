import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRACE_PERIOD_DAYS = 7;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('Running subscription grace period check...');

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const results = {
      newSuspensions: 0,
      reminders: 0,
      cancellations: 0,
      errors: [] as string[],
    };

    // 1. Find pending/overdue subscription invoices
    const { data: overdueInvoices, error: invoiceError } = await supabase
      .from('subscription_invoices')
      .select(`
        *,
        merchants!inner(id, user_id, business_name),
        subscription_tiers!inner(id, name, display_name)
      `)
      .eq('status', 'pending')
      .lt('due_date', now.toISOString()); // Due date has passed

    if (invoiceError) {
      console.error('Error fetching overdue invoices:', invoiceError);
      throw invoiceError;
    }

    console.log(`Found ${overdueInvoices?.length || 0} overdue subscription invoices`);

    for (const invoice of overdueInvoices || []) {
      try {
        const merchantId = invoice.merchant_id;
        const merchantUserId = invoice.merchants.user_id;

        // Get the subscription
        const { data: subscription } = await supabase
          .from('merchant_subscriptions')
          .select('*')
          .eq('merchant_id', merchantId)
          .single();

        if (!subscription) {
          console.log(`No subscription found for merchant ${merchantId}`);
          continue;
        }

        // Get profile for notifications
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', merchantUserId)
          .single();

        // Check if already suspended
        if (subscription.status === 'suspended') {
          // Calculate days in grace period
          const gracePeriodEnd = subscription.grace_period_end 
            ? new Date(subscription.grace_period_end) 
            : null;

          if (gracePeriodEnd) {
            const daysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

            if (daysRemaining <= 0) {
              // Grace period expired - cancel subscription
              console.log(`Grace period expired for merchant ${merchantId}, cancelling subscription`);

              // Get free tier
              const { data: freeTier } = await supabase
                .from('subscription_tiers')
                .select('id')
                .eq('name', 'free')
                .single();

              if (freeTier) {
                // Downgrade to free tier
                await supabase
                  .from('merchant_subscriptions')
                  .update({
                    tier_id: freeTier.id,
                    status: 'cancelled',
                    payment_status: 'failed',
                    grace_period_end: null,
                    canceled_at: now.toISOString(),
                    cancellation_reason: 'Payment not received within grace period',
                  })
                  .eq('id', subscription.id);

                // Update invoice status
                await supabase
                  .from('subscription_invoices')
                  .update({ status: 'failed' })
                  .eq('id', invoice.id);

                // Create notification
                await supabase.from('notifications').insert({
                  user_id: merchantUserId,
                  title: 'Subscription Cancelled',
                  message: `Your subscription has been cancelled due to non-payment. You've been downgraded to the Free plan.`,
                  type: 'subscription',
                  link: '/merchant/billing',
                });

                // Send cancellation email
                if (profile?.email) {
                  try {
                    await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                      },
                      body: JSON.stringify({
                        type: 'subscription_cancelled',
                        recipientEmail: profile.email,
                        recipientName: profile.full_name || invoice.merchants.business_name,
                        data: {
                          tierName: invoice.subscription_tiers.display_name,
                          reason: 'Payment not received within 7-day grace period',
                          reactivateUrl: '/merchant/billing',
                        },
                      }),
                    });
                  } catch (emailError) {
                    console.error('Cancellation email error:', emailError);
                  }
                }

                results.cancellations++;
              }
            } else {
              // Send daily reminder during grace period
              console.log(`Grace period reminder for merchant ${merchantId}: ${daysRemaining} days remaining`);

              await supabase.from('notifications').insert({
                user_id: merchantUserId,
                title: `Payment Overdue - ${daysRemaining} Days Left`,
                message: `Your subscription will be cancelled in ${daysRemaining} days if payment is not received.`,
                type: 'subscription',
                link: '/merchant/billing',
              });

              // Send reminder email
              if (profile?.email) {
                try {
                  await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    },
                    body: JSON.stringify({
                      type: 'subscription_renewal_reminder',
                      recipientEmail: profile.email,
                      recipientName: profile.full_name || invoice.merchants.business_name,
                      data: {
                        tierName: invoice.subscription_tiers.display_name,
                        amount: invoice.amount,
                        daysRemaining,
                        paymentUrl: invoice.xendit_payment_url,
                        isGracePeriod: true,
                      },
                    }),
                  });
                } catch (emailError) {
                  console.error('Reminder email error:', emailError);
                }
              }

              results.reminders++;
            }
          }
        } else {
          // First time overdue - suspend subscription
          console.log(`First overdue for merchant ${merchantId}, suspending subscription`);

          const gracePeriodEnd = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

          // Suspend the subscription
          await supabase
            .from('merchant_subscriptions')
            .update({
              status: 'suspended',
              payment_status: 'overdue',
              grace_period_end: gracePeriodEnd.toISOString(),
            })
            .eq('id', subscription.id);

          // Increment failed attempts on invoice
          await supabase
            .from('subscription_invoices')
            .update({ 
              attempt_count: (invoice.attempt_count || 1) + 1,
              last_attempt_at: now.toISOString(),
            })
            .eq('id', invoice.id);

          // Create notification
          await supabase.from('notifications').insert({
            user_id: merchantUserId,
            title: 'Subscription Suspended',
            message: `Your subscription has been suspended due to overdue payment. You have ${GRACE_PERIOD_DAYS} days to pay before cancellation.`,
            type: 'subscription',
            link: '/merchant/billing',
          });

          // Send suspension email
          if (profile?.email) {
            try {
              await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  type: 'subscription_suspended',
                  recipientEmail: profile.email,
                  recipientName: profile.full_name || invoice.merchants.business_name,
                  data: {
                    tierName: invoice.subscription_tiers.display_name,
                    amount: invoice.amount,
                    gracePeriodDays: GRACE_PERIOD_DAYS,
                    gracePeriodEnd: gracePeriodEnd.toLocaleDateString('id-ID'),
                    paymentUrl: invoice.xendit_payment_url,
                  },
                }),
              });
            } catch (emailError) {
              console.error('Suspension email error:', emailError);
            }
          }

          results.newSuspensions++;
        }
      } catch (processError) {
        console.error(`Error processing invoice ${invoice.id}:`, processError);
        results.errors.push(`Error for invoice ${invoice.id}: ${processError}`);
      }
    }

    console.log('Subscription grace check results:', results);

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
    console.error('Error in subscription grace check:', error);
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
