import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MerchantWithEscrow {
  id: string;
  business_name: string;
  disbursement_schedule: string;
  user_id: string;
  escrow_accounts: {
    id: string;
    balance: number;
  }[];
  bank_accounts: {
    id: string;
    bank_name: string;
    account_number: string;
    account_name: string;
    is_primary: boolean;
  }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting scheduled disbursement processing...');

    // Get current day info for scheduling logic
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = now.getDate();

    // Determine which schedules to process
    const schedulesToProcess: string[] = ['daily'];
    
    // Weekly: Process on Mondays
    if (dayOfWeek === 1) {
      schedulesToProcess.push('weekly');
    }
    
    // Monthly: Process on 1st of month
    if (dayOfMonth === 1) {
      schedulesToProcess.push('monthly');
    }

    console.log(`Processing schedules: ${schedulesToProcess.join(', ')}`);

    // Get merchants with escrow balances that need disbursement
    const { data: merchants, error: merchantError } = await supabase
      .from('merchants')
      .select(`
        id,
        business_name,
        disbursement_schedule,
        user_id,
        escrow_accounts (
          id,
          balance
        ),
        bank_accounts (
          id,
          bank_name,
          account_number,
          account_name,
          is_primary
        )
      `)
      .in('disbursement_schedule', schedulesToProcess)
      .eq('verification_status', 'verified');

    if (merchantError) {
      console.error('Error fetching merchants:', merchantError);
      throw merchantError;
    }

    console.log(`Found ${merchants?.length || 0} merchants to process`);

    const results = {
      processed: 0,
      skipped: 0,
      failed: 0,
      totalAmount: 0,
      errors: [] as string[],
    };

    for (const merchant of (merchants as MerchantWithEscrow[]) || []) {
      try {
        const escrowAccount = merchant.escrow_accounts?.[0];
        const primaryBankAccount = merchant.bank_accounts?.find(ba => ba.is_primary) || merchant.bank_accounts?.[0];

        // Skip if no escrow account or insufficient balance
        if (!escrowAccount || escrowAccount.balance <= 0) {
          console.log(`Skipping ${merchant.business_name}: No balance or escrow account`);
          results.skipped++;
          continue;
        }

        // Skip if no bank account configured
        if (!primaryBankAccount) {
          console.log(`Skipping ${merchant.business_name}: No bank account configured`);
          results.skipped++;
          results.errors.push(`${merchant.business_name}: No bank account`);
          continue;
        }

        const amount = escrowAccount.balance;
        const feeAmount = amount * 0.01; // 1% platform fee
        const netAmount = amount - feeAmount;

        console.log(`Processing disbursement for ${merchant.business_name}: ${amount}`);

        // Create disbursement record
        const { data: disbursement, error: disbursementError } = await supabase
          .from('disbursements')
          .insert({
            escrow_account_id: escrowAccount.id,
            bank_account_id: primaryBankAccount.id,
            amount,
            fee_amount: feeAmount,
            net_amount: netAmount,
            type: 'rent',
            status: 'pending',
            scheduled_for: now.toISOString(),
          })
          .select()
          .single();

        if (disbursementError) {
          console.error(`Error creating disbursement for ${merchant.business_name}:`, disbursementError);
          results.failed++;
          results.errors.push(`${merchant.business_name}: ${disbursementError.message}`);
          continue;
        }

        // Update escrow balance (move to pending)
        const { error: escrowError } = await supabase
          .from('escrow_accounts')
          .update({
            balance: 0,
            pending_balance: amount,
          })
          .eq('id', escrowAccount.id);

        if (escrowError) {
          console.error(`Error updating escrow for ${merchant.business_name}:`, escrowError);
        }

        // Create escrow transaction record
        await supabase
          .from('escrow_transactions')
          .insert({
            escrow_account_id: escrowAccount.id,
            amount: -amount,
            type: 'disbursement',
            status: 'pending',
            description: `Scheduled ${merchant.disbursement_schedule} disbursement`,
            reference: disbursement.id,
          });

        // Create notification for merchant
        await supabase
          .from('notifications')
          .insert({
            user_id: merchant.user_id,
            title: 'Disbursement Scheduled',
            message: `A disbursement of Rp ${netAmount.toLocaleString()} has been scheduled for your account.`,
            type: 'payment',
            link: '/merchant/escrow',
          });

        results.processed++;
        results.totalAmount += netAmount;

        console.log(`Successfully scheduled disbursement for ${merchant.business_name}`);

      } catch (error) {
        console.error(`Error processing merchant ${merchant.business_name}:`, error);
        results.failed++;
        results.errors.push(`${merchant.business_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Disbursement processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled disbursement processing complete',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Scheduled disbursement error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});