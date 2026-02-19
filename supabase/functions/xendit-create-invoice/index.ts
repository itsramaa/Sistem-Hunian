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
    const XENDIT_SECRET_KEY = Deno.env.get('XENDIT_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!XENDIT_SECRET_KEY) {
      throw new Error('XENDIT_SECRET_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { 
      payment_id, 
      invoice_id, 
      order_id, 
      amount, 
      description, 
      payer_email, 
      payer_name,
      user_id,
      payment_type, // 'rent', 'invoice', 'order'
      preferred_method
    } = await req.json();

    // Input validation
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid amount' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    if (!payer_email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payer email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Creating Xendit invoice:', { payment_id, invoice_id, order_id, amount, payment_type, preferred_method });

    // Generate unique external_id
    const external_id = `${payment_type}_${payment_id || invoice_id || order_id}_${Date.now()}`;

    // Map preferred_method to Xendit payment_methods
    let payment_methods = ['BANK_TRANSFER', 'EWALLET', 'QR_CODE', 'CREDIT_CARD'];
    if (preferred_method) {
      switch (preferred_method) {
        case 'bank_transfer':
          payment_methods = ['BANK_TRANSFER'];
          break;
        case 'ewallet':
          payment_methods = ['EWALLET'];
          break;
        case 'qris':
          payment_methods = ['QR_CODE'];
          break;
        case 'credit_card':
          payment_methods = ['CREDIT_CARD'];
          break;
      }
    }

    // Create Xendit Invoice
    const xenditPayload = {
      external_id,
      amount,
      description: description || `Payment for ${payment_type}`,
      payer_email,
      currency: 'IDR',
      invoice_duration: 86400, // 24 hours
      customer: {
        given_names: payer_name,
        email: payer_email,
      },
      success_redirect_url: `${req.headers.get('origin')}/payment/success`,
      failure_redirect_url: `${req.headers.get('origin')}/payment/failed`,
      payment_methods,
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
    console.log('Xendit invoice created:', xenditData);

    // Store transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from('xendit_transactions')
      .insert({
        xendit_invoice_id: xenditData.id,
        external_id,
        payment_id,
        invoice_id,
        order_id,
        user_id,
        amount,
        status: 'pending',
        payment_url: xenditData.invoice_url,
        expired_at: xenditData.expiry_date,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
      throw new Error(`Database error: ${transactionError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        payment_url: xenditData.invoice_url,
        xendit_invoice_id: xenditData.id,
        expiry_date: xenditData.expiry_date,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error creating Xendit invoice:', error);
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
