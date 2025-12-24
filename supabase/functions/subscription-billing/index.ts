import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const XENDIT_SECRET_KEY = Deno.env.get('XENDIT_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!XENDIT_SECRET_KEY) {
      throw new Error('XENDIT_SECRET_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('Running subscription billing check...');

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Find active subscriptions with paid tiers where billing is due today
    const { data: subscriptions, error: fetchError } = await supabase
      .from('merchant_subscriptions')
      .select(`
        *,
        merchants!inner(id, user_id, business_name),
        subscription_tiers!inner(id, name, display_name, price_monthly, price_yearly)
      `)
      .eq('status', 'active')
      .gt('subscription_tiers.price_monthly', 0); // Only paid tiers

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${subscriptions?.length || 0} active paid subscriptions`);

    const results = {
      invoicesCreated: 0,
      invoicesSkipped: 0,
      errors: [] as string[],
    };

    for (const sub of subscriptions || []) {
      try {
        const periodEnd = new Date(sub.current_period_end);
        const periodEndDate = periodEnd.toISOString().split('T')[0];

        // Check if billing is due today (period ends today or next_billing_date is today)
        const nextBillingDate = sub.next_billing_date ? new Date(sub.next_billing_date).toISOString().split('T')[0] : null;
        const shouldBillToday = periodEndDate === today || nextBillingDate === today;

        if (!shouldBillToday) {
          continue; // Not due today
        }

        // Check if invoice already exists for this billing period
        const billingPeriodStart = sub.current_period_end;
        const { data: existingInvoice } = await supabase
          .from('subscription_invoices')
          .select('id')
          .eq('merchant_id', sub.merchant_id)
          .eq('billing_period_start', billingPeriodStart)
          .maybeSingle();

        if (existingInvoice) {
          console.log(`Invoice already exists for merchant ${sub.merchant_id}, skipping`);
          results.invoicesSkipped++;
          continue;
        }

        // Determine billing period (check if yearly based on period length)
        const periodStart = new Date(sub.current_period_start);
        const monthsDiff = (periodEnd.getTime() - periodStart.getTime()) / (30 * 24 * 60 * 60 * 1000);
        const isYearly = monthsDiff > 6; // If period > 6 months, it's yearly

        const amount = isYearly && sub.subscription_tiers.price_yearly 
          ? sub.subscription_tiers.price_yearly 
          : sub.subscription_tiers.price_monthly;

        // Calculate new billing period
        const newPeriodEnd = new Date(sub.current_period_end);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + (isYearly ? 12 : 1));

        // Get merchant profile for email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', sub.merchants.user_id)
          .single();

        if (!profile?.email) {
          console.error(`No profile/email found for merchant ${sub.merchant_id}`);
          results.errors.push(`No email for merchant ${sub.merchant_id}`);
          continue;
        }

        // Create Xendit Invoice
        const externalId = `subinv_${sub.merchant_id}_${sub.tier_id}_${Date.now()}`;
        const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        const xenditPayload = {
          external_id: externalId,
          amount,
          description: `${sub.subscription_tiers.display_name} Subscription - ${isYearly ? 'Annual' : 'Monthly'} Renewal`,
          payer_email: profile.email,
          currency: 'IDR',
          invoice_duration: 7 * 24 * 60 * 60, // 7 days
          customer: {
            given_names: profile.full_name || sub.merchants.business_name,
            email: profile.email,
          },
          success_redirect_url: `${SUPABASE_URL?.replace('supabase.co', 'lovable.app')}/merchant/settings?payment=success`,
          failure_redirect_url: `${SUPABASE_URL?.replace('supabase.co', 'lovable.app')}/merchant/settings?payment=failed`,
          payment_methods: ['BANK_TRANSFER', 'EWALLET', 'QR_CODE'],
          metadata: {
            type: 'subscription_renewal',
            merchant_id: sub.merchant_id,
            tier_id: sub.tier_id,
            subscription_id: sub.id,
            billing_period: isYearly ? 'yearly' : 'monthly',
          }
        };

        console.log(`Creating Xendit invoice for merchant ${sub.merchant_id}, amount: ${amount}`);

        const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(XENDIT_SECRET_KEY + ':')}`,
          },
          body: JSON.stringify(xenditPayload),
        });

        if (!xenditResponse.ok) {
          const errorData = await xenditResponse.text();
          console.error('Xendit API error:', errorData);
          results.errors.push(`Xendit error for ${sub.merchant_id}: ${errorData}`);
          continue;
        }

        const xenditData = await xenditResponse.json();
        console.log('Xendit invoice created:', xenditData.id);

        // Insert subscription_invoices record
        const { error: invoiceError } = await supabase
          .from('subscription_invoices')
          .insert({
            merchant_id: sub.merchant_id,
            subscription_id: sub.id,
            tier_id: sub.tier_id,
            amount,
            status: 'pending',
            due_date: dueDate.toISOString(),
            billing_period_start: sub.current_period_end,
            billing_period_end: newPeriodEnd.toISOString(),
            xendit_invoice_id: xenditData.id,
            xendit_payment_url: xenditData.invoice_url,
            attempt_count: 1,
            last_attempt_at: now.toISOString(),
          });

        if (invoiceError) {
          console.error('Error inserting subscription invoice:', invoiceError);
          results.errors.push(`DB error for ${sub.merchant_id}: ${invoiceError.message}`);
          continue;
        }

        // Update subscription status
        await supabase
          .from('merchant_subscriptions')
          .update({
            payment_status: 'pending',
            next_billing_date: dueDate.toISOString(),
          })
          .eq('id', sub.id);

        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: sub.merchants.user_id,
          title: 'Subscription Renewal Invoice',
          message: `Your ${sub.subscription_tiers.display_name} subscription renewal invoice of Rp ${amount.toLocaleString('id-ID')} is ready for payment.`,
          type: 'subscription',
          link: '/merchant/billing',
        });

        // Send email notification
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              type: 'subscription_invoice',
              recipientEmail: profile.email,
              recipientName: profile.full_name || sub.merchants.business_name,
              data: {
                tierName: sub.subscription_tiers.display_name,
                amount,
                billingPeriod: isYearly ? 'Annual' : 'Monthly',
                dueDate: dueDate.toLocaleDateString('id-ID'),
                paymentUrl: xenditData.invoice_url,
                invoiceId: externalId,
              },
            }),
          });
          console.log('Email notification sent');
        } catch (emailError) {
          console.error('Email notification error:', emailError);
        }

        results.invoicesCreated++;
        console.log(`Invoice created for merchant ${sub.merchant_id}`);

      } catch (subError) {
        console.error(`Error processing subscription ${sub.id}:`, subError);
        results.errors.push(`Error for ${sub.merchant_id}: ${subError}`);
      }
    }

    console.log('Subscription billing results:', results);

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
    console.error('Error in subscription billing:', error);
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
