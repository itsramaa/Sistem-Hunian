import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
};

// Fee rates
const PLATFORM_FEE_RATE = 0.01; // 1%
const GATEWAY_FEE_RATE = 0.025; // 2.5%

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
      // Check if this is a subscription invoice renewal payment (subinv_ prefix)
      if (external_id.startsWith('subinv_')) {
        // Parse subscription invoice metadata from external_id: subinv_{merchant_id}_{tier_id}_{timestamp}
        const parts = external_id.split('_');
        if (parts.length >= 3) {
          const merchantId = parts[1];
          const tierId = parts[2];

          console.log(`Processing subscription invoice payment for merchant ${merchantId}`);

          // Update subscription_invoices record
          const { data: subInvoice, error: invoiceUpdateError } = await supabase
            .from('subscription_invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              payment_method: payment_channel || payment_method,
            })
            .eq('xendit_invoice_id', id)
            .select('*')
            .single();

          if (invoiceUpdateError) {
            console.error('Subscription invoice update error:', invoiceUpdateError);
          } else {
            console.log('Subscription invoice marked as paid:', subInvoice?.id);

            // Get tier details
            const { data: tier } = await supabase
              .from('subscription_tiers')
              .select('*')
              .eq('id', tierId)
              .single();

            if (tier && subInvoice) {
              // Update merchant subscription - reactivate if suspended
              const { error: subError } = await supabase
                .from('merchant_subscriptions')
                .update({
                  tier_id: tierId,
                  status: 'active',
                  payment_status: 'paid',
                  current_period_start: subInvoice.billing_period_start,
                  current_period_end: subInvoice.billing_period_end,
                  next_billing_date: subInvoice.billing_period_end,
                  grace_period_end: null, // Clear grace period
                  failed_attempts: 0,
                })
                .eq('merchant_id', merchantId);

              if (subError) {
                console.error('Subscription update error:', subError);
              } else {
                console.log('Subscription reactivated/renewed successfully');
              }

              // Get merchant details for notification
              const { data: merchant } = await supabase
                .from('merchants')
                .select('user_id, business_name')
                .eq('id', merchantId)
                .single();

              if (merchant) {
                // Create notification
                await supabase.from('notifications').insert({
                  user_id: merchant.user_id,
                  title: 'Subscription Renewed!',
                  message: `Your ${tier.display_name} subscription has been renewed successfully. Valid until ${new Date(subInvoice.billing_period_end).toLocaleDateString('id-ID')}.`,
                  type: 'subscription',
                  link: '/merchant/settings',
                });

                // Get profile for email
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('email, full_name')
                  .eq('user_id', merchant.user_id)
                  .single();

                if (profile) {
                  // Send email notification
                  try {
                    await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                      },
                      body: JSON.stringify({
                        type: 'subscription_payment',
                        recipientEmail: profile.email,
                        recipientName: profile.full_name || 'Merchant',
                        data: {
                          tierName: tier.display_name,
                          amount: paid_amount,
                          paymentDate: new Date().toLocaleDateString('id-ID'),
                          reference: external_id,
                          validUntil: new Date(subInvoice.billing_period_end).toLocaleDateString('id-ID'),
                        },
                      }),
                    });
                  } catch (emailError) {
                    console.error('Email notification error:', emailError);
                  }
                }
              }
            }
          }
        }
      }
      // Check if this is an initial subscription payment (sub_ prefix)
      else if (external_id.startsWith('sub_')) {
        // Parse subscription metadata from external_id: sub_{merchant_id}_{tier_id}_{timestamp}
        const parts = external_id.split('_');
        if (parts.length >= 3) {
          const merchantId = parts[1];
          const tierId = parts[2];

          // Get tier details
          const { data: tier } = await supabase
            .from('subscription_tiers')
            .select('*')
            .eq('id', tierId)
            .single();

          if (tier) {
            // Calculate period end (1 month or 1 year from now)
            const periodEnd = new Date();
            const isYearly = tier.price_yearly && paid_amount === tier.price_yearly;
            periodEnd.setMonth(periodEnd.getMonth() + (isYearly ? 12 : 1));

            // Update subscription
            const { error: subError } = await supabase
              .from('merchant_subscriptions')
              .update({
                tier_id: tierId,
                status: 'active',
                payment_status: 'paid',
                current_period_start: new Date().toISOString(),
                current_period_end: periodEnd.toISOString(),
                next_billing_date: periodEnd.toISOString(),
                trial_ends_at: null,
                grace_period_end: null,
                failed_attempts: 0,
              })
              .eq('merchant_id', merchantId);

            if (subError) {
              console.error('Subscription update error:', subError);
            } else {
              console.log('Subscription upgraded successfully');
            }

            // Get merchant details for notification
            const { data: merchant } = await supabase
              .from('merchants')
              .select('user_id, business_name')
              .eq('id', merchantId)
              .single();

            if (merchant) {
              // Create notification
              await supabase.from('notifications').insert({
                user_id: merchant.user_id,
                title: 'Subscription Upgraded!',
                message: `Your subscription has been upgraded to ${tier.display_name}. Enjoy your new features!`,
                type: 'subscription',
                link: '/merchant/settings',
              });

              // Get profile for email
              const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('user_id', merchant.user_id)
                .single();

              if (profile) {
                // Send email notification
                try {
                  await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    },
                    body: JSON.stringify({
                      type: 'subscription_upgrade',
                      recipientEmail: profile.email,
                      recipientName: profile.full_name || 'Merchant',
                      data: {
                        tierName: tier.display_name,
                        amount: paid_amount,
                        validUntil: periodEnd.toLocaleDateString('id-ID'),
                        maxProperties: tier.max_properties,
                        maxUnits: tier.max_units,
                        maxTenants: tier.max_tenants,
                        features: tier.features || [],
                        dashboardLink: '/merchant/dashboard',
                      },
                    }),
                  });
                } catch (emailError) {
                  console.error('Email notification error:', emailError);
                }
              }
            }
          }
        }
      } else {
        // Regular payment processing
        const grossAmount = paid_amount || transaction.amount;
        
        // Calculate fees
        const platformFee = Math.round(grossAmount * PLATFORM_FEE_RATE);
        const gatewayFee = Math.round(grossAmount * GATEWAY_FEE_RATE);
        const netAmount = grossAmount - platformFee - gatewayFee;

        console.log(`Fee calculation: Gross=${grossAmount}, Platform=${platformFee}, Gateway=${gatewayFee}, Net=${netAmount}`);

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

        // Create escrow transaction for rent payments with fee calculation
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
              // Insert escrow transaction with fee breakdown
              await supabase.from('escrow_transactions').insert({
                escrow_account_id: escrowAccount.id,
                amount: netAmount, // Net amount after fees
                gross_amount: grossAmount,
                platform_fee: platformFee,
                gateway_fee: gatewayFee,
                type: 'deposit',
                status: 'completed',
                description: `Rent payment received (Net after ${PLATFORM_FEE_RATE * 100}% platform + ${GATEWAY_FEE_RATE * 100}% gateway fee)`,
                contract_id: payment.contract_id,
                reference: external_id,
                processed_at: new Date().toISOString(),
              });

              // Update escrow account balance with NET amount only
              const { data: currentEscrow } = await supabase
                .from('escrow_accounts')
                .select('balance')
                .eq('id', escrowAccount.id)
                .single();

              if (currentEscrow) {
                await supabase
                  .from('escrow_accounts')
                  .update({ balance: currentEscrow.balance + netAmount })
                  .eq('id', escrowAccount.id);
              }

              console.log('Escrow transaction created with fees');

              // Notify merchant about payment received
              const { data: merchant } = await supabase
                .from('merchants')
                .select('user_id, business_name')
                .eq('id', payment.merchant_id)
                .single();

              if (merchant) {
                // Get tenant info for merchant notification
                const { data: tenantProfile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('user_id', transaction.user_id)
                  .single();

                const tenantName = tenantProfile?.full_name || 'Penyewa';

                // Create in-app notification for merchant
                await supabase.from('notifications').insert({
                  user_id: merchant.user_id,
                  title: 'Pembayaran Diterima',
                  message: `Pembayaran Rp ${grossAmount.toLocaleString('id-ID')} dari ${tenantName} telah diterima. Net ke escrow: Rp ${netAmount.toLocaleString('id-ID')}`,
                  type: 'payment',
                  link: '/merchant/payments',
                });

                console.log('Merchant notification created');

                // Send email to merchant
                const { data: merchantProfile } = await supabase
                  .from('profiles')
                  .select('email, full_name')
                  .eq('user_id', merchant.user_id)
                  .single();

                if (merchantProfile) {
                  try {
                    await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                      },
                      body: JSON.stringify({
                        type: 'payment_received',
                        recipientEmail: merchantProfile.email,
                        recipientName: merchantProfile.full_name || 'Merchant',
                        data: {
                          tenantName,
                          grossAmount,
                          platformFee,
                          gatewayFee,
                          netAmount,
                          paymentMethod: payment_channel || payment_method,
                          transactionId: external_id,
                        },
                      }),
                    });
                    console.log('Merchant email notification sent');
                  } catch (emailError) {
                    console.error('Merchant email notification error:', emailError);
                  }
                }
              }
            }
          }
        }

        // Create notification for tenant
        await supabase.from('notifications').insert({
          user_id: transaction.user_id,
          title: 'Pembayaran Berhasil',
          message: `Pembayaran Rp ${grossAmount.toLocaleString('id-ID')} telah dikonfirmasi.`,
          type: 'payment',
          link: '/tenant/payments',
        });

        // Send email receipt to tenant
        const { data: tenantProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', transaction.user_id)
          .single();

        if (tenantProfile) {
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                type: 'payment_receipt',
                recipientEmail: tenantProfile.email,
                recipientName: tenantProfile.full_name || 'Tenant',
                data: {
                  amount: grossAmount,
                  paymentMethod: payment_channel || payment_method,
                  transactionId: external_id,
                  paidAt: new Date().toISOString(),
                },
              }),
            });
            console.log('Tenant email receipt sent');
          } catch (emailError) {
            console.error('Tenant email receipt error:', emailError);
          }
        }
      }
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
