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
      escrow_account_id,
      vendor_id,
      bank_account_id,
      amount,
      description,
      type // 'rent' or 'vendor_order'
    } = await req.json();

    console.log('Creating disbursement:', { escrow_account_id, vendor_id, amount, type });

    // Get bank account details
    let bankAccount;
    if (vendor_id) {
      const { data } = await supabase
        .from('vendor_bank_accounts')
        .select('*')
        .eq('id', bank_account_id)
        .single();
      bankAccount = data;
    } else {
      const { data } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', bank_account_id)
        .single();
      bankAccount = data;
    }

    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    // Calculate fee (Xendit disbursement fee)
    const feeAmount = 5500; // Rp 5,500 per disbursement
    const netAmount = amount - feeAmount;

    if (netAmount <= 0) {
      throw new Error('Amount too small after fee deduction');
    }

    // Generate unique external_id
    const external_id = `disbursement_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Map bank names to Xendit bank codes
    const bankCodeMap: Record<string, string> = {
      'BCA': 'BCA',
      'BNI': 'BNI',
      'BRI': 'BRI',
      'MANDIRI': 'MANDIRI',
      'CIMB': 'CIMB',
      'PERMATA': 'PERMATA',
      'BSI': 'BSI',
      'DANAMON': 'DANAMON',
    };

    const bankCode = bankCodeMap[bankAccount.bank_name.toUpperCase()] || bankAccount.bank_name;

    // Create Xendit Disbursement
    const xenditPayload = {
      external_id,
      amount: netAmount,
      bank_code: bankCode,
      account_holder_name: bankAccount.account_name,
      account_number: bankAccount.account_number,
      description: description || `Disbursement - ${type}`,
    };

    const xenditResponse = await fetch('https://api.xendit.co/disbursements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(XENDIT_SECRET_KEY + ':')}`,
        'X-IDEMPOTENCY-KEY': external_id,
      },
      body: JSON.stringify(xenditPayload),
    });

    if (!xenditResponse.ok) {
      const errorData = await xenditResponse.text();
      console.error('Xendit Disbursement API error:', errorData);
      throw new Error(`Xendit API error: ${errorData}`);
    }

    const xenditData = await xenditResponse.json();
    console.log('Xendit disbursement created:', xenditData);

    // Store disbursement in database
    const { data: disbursement, error: disbursementError } = await supabase
      .from('disbursements')
      .insert({
        escrow_account_id,
        vendor_id,
        type,
        amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        status: xenditData.status === 'COMPLETED' ? 'completed' : 'processing',
        bank_account_id,
        xendit_disbursement_id: xenditData.id,
        xendit_reference: external_id,
        processed_at: xenditData.status === 'COMPLETED' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (disbursementError) {
      console.error('Disbursement insert error:', disbursementError);
      throw new Error(`Database error: ${disbursementError.message}`);
    }

    // If escrow account, update the pending balance
    if (escrow_account_id) {
      const { data: escrow } = await supabase
        .from('escrow_accounts')
        .select('balance, pending_balance')
        .eq('id', escrow_account_id)
        .single();

      if (escrow) {
        await supabase
          .from('escrow_accounts')
          .update({
            balance: escrow.balance - amount,
            pending_balance: escrow.pending_balance + amount,
          })
          .eq('id', escrow_account_id);
      }

      // Create escrow transaction
      await supabase.from('escrow_transactions').insert({
        escrow_account_id,
        amount: -amount,
        type: 'withdrawal',
        status: 'processing',
        description: `Disbursement to ${bankAccount.account_name}`,
        reference: external_id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        disbursement_id: disbursement.id,
        xendit_id: xenditData.id,
        status: xenditData.status,
        amount: netAmount,
        fee: feeAmount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error creating disbursement:', error);
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
