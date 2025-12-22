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

    const { 
      merchant_id,
      tier_id,
      billing_cycle, // 'monthly' or 'yearly'
      user_id,
      payer_email,
      payer_name
    } = await req.json();

    console.log('Processing subscription payment:', { merchant_id, tier_id, billing_cycle });

    // Get tier details
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tier_id)
      .single();

    if (tierError || !tier) {
      throw new Error('Subscription tier not found');
    }

    const amount = billing_cycle === 'yearly' && tier.price_yearly 
      ? tier.price_yearly 
      : tier.price_monthly;

    if (amount === 0) {
      // Free tier - just update subscription
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + (billing_cycle === 'yearly' ? 12 : 1));

      const { error: updateError } = await supabase
        .from('merchant_subscriptions')
        .update({
          tier_id,
          status: 'active',
          payment_status: 'paid',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          trial_ends_at: null,
        })
        .eq('merchant_id', merchant_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, free_tier: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate external ID
    const external_id = `sub_${merchant_id}_${tier_id}_${Date.now()}`;

    // Create Xendit Invoice
    const xenditPayload = {
      external_id,
      amount,
      description: `${tier.display_name} Subscription - ${billing_cycle === 'yearly' ? 'Annual' : 'Monthly'}`,
      payer_email,
      currency: 'IDR',
      invoice_duration: 86400, // 24 hours
      customer: {
        given_names: payer_name,
        email: payer_email,
      },
      success_redirect_url: `${req.headers.get('origin')}/merchant/settings?payment=success`,
      failure_redirect_url: `${req.headers.get('origin')}/merchant/settings?payment=failed`,
      payment_methods: ['BANK_TRANSFER', 'EWALLET', 'QR_CODE'],
      metadata: {
        type: 'subscription',
        merchant_id,
        tier_id,
        billing_cycle,
      }
    };

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
      throw new Error(`Xendit API error: ${errorData}`);
    }

    const xenditData = await xenditResponse.json();
    console.log('Xendit subscription invoice created:', xenditData);

    // Store transaction
    const { error: transactionError } = await supabase
      .from('xendit_transactions')
      .insert({
        xendit_invoice_id: xenditData.id,
        external_id,
        user_id,
        amount,
        status: 'pending',
        payment_url: xenditData.invoice_url,
        expired_at: xenditData.expiry_date,
      });

    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
    }

    // Update subscription to pending payment
    await supabase
      .from('merchant_subscriptions')
      .update({
        payment_status: 'pending',
        next_billing_date: new Date().toISOString(),
      })
      .eq('merchant_id', merchant_id);

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: xenditData.invoice_url,
        xendit_invoice_id: xenditData.id,
        amount,
        tier_name: tier.display_name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error processing subscription payment:', error);
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
