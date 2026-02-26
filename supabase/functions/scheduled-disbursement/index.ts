import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MerchantWithEscrow {
  id: string;
  business_name: string;
  user_id: string;
  min_disbursement_amount: number | null;
  total_disbursed: number | null;
  merchant_subscriptions: {
    disbursement_schedule: string;
  }[];
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

// Fee rates based on schedule
const FEE_RATES: Record<string, number> = {
  daily: 0.0025,   // 0.25%
  weekly: 0,       // Free
  monthly: 0,      // Free
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    
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
        user_id,
        min_disbursement_amount,
        total_disbursed,
        merchant_subscriptions!inner (
          disbursement_schedule
        ),
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
      .in('merchant_subscriptions.disbursement_schedule', schedulesToProcess)
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
        const minAmount = merchant.min_disbursement_amount || 100000;
        if (!escrowAccount || escrowAccount.balance < minAmount) {
          console.log(`Skipping ${merchant.business_name}: Balance ${escrowAccount?.balance || 0} below minimum ${minAmount}`);
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
        const disbursementSchedule = merchant.merchant_subscriptions?.[0]?.disbursement_schedule || 'weekly';
        const feeRate = FEE_RATES[disbursementSchedule] || 0;
        const feeAmount = amount * feeRate;
        const netAmount = amount - feeAmount;

        console.log(`Processing disbursement for ${merchant.business_name}: ${amount} (fee: ${feeAmount}, net: ${netAmount})`);

        // Generate unique external_id for Xendit
        const externalId = `scheduled_${merchant.id}_${Date.now()}`;

        // If Xendit key is available, call Xendit API
        let xenditResponse = null;
        let disbursementStatus = 'pending';
        let xenditDisbursementId = null;

        if (xenditSecretKey) {
          try {
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
            const bankCode = bankCodeMap[primaryBankAccount.bank_name.toUpperCase()] || primaryBankAccount.bank_name;

            const xenditPayload = {
              external_id: externalId,
              amount: netAmount,
              bank_code: bankCode,
              account_holder_name: primaryBankAccount.account_name,
              account_number: primaryBankAccount.account_number,
              description: `Scheduled ${disbursementSchedule} disbursement`,
            };

            const response = await fetch('https://api.xendit.co/disbursements', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(xenditSecretKey + ':')}`,
                'X-IDEMPOTENCY-KEY': externalId,
              },
              body: JSON.stringify(xenditPayload),
            });

            if (response.ok) {
              xenditResponse = await response.json();
              xenditDisbursementId = xenditResponse.id;
              disbursementStatus = xenditResponse.status === 'COMPLETED' ? 'completed' : 'processing';
              console.log(`Xendit disbursement created: ${xenditDisbursementId}`);
            } else {
              const errorText = await response.text();
              console.error(`Xendit API error for ${merchant.business_name}:`, errorText);
              results.failed++;
              results.errors.push(`${merchant.business_name}: Xendit API error - ${errorText}`);
              continue;
            }
          } catch (xenditError) {
            console.error(`Xendit call failed for ${merchant.business_name}:`, xenditError);
            results.failed++;
            results.errors.push(`${merchant.business_name}: ${xenditError instanceof Error ? xenditError.message : 'Xendit error'}`);
            continue;
          }
        }

        // Create disbursement record
        const { data: disbursement, error: disbursementError } = await supabase
          .from('disbursements')
          .insert({
            escrow_account_id: escrowAccount.id,
            bank_account_id: primaryBankAccount.id,
            amount,
            fee_amount: feeAmount,
            net_amount: netAmount,
            type: 'scheduled',
            status: disbursementStatus,
            scheduled_for: now.toISOString(),
            xendit_disbursement_id: xenditDisbursementId,
            xendit_reference: externalId,
            processed_at: disbursementStatus === 'completed' ? now.toISOString() : null,
            completed_at: disbursementStatus === 'completed' ? now.toISOString() : null,
          })
          .select()
          .single();

        if (disbursementError) {
          console.error(`Error creating disbursement for ${merchant.business_name}:`, disbursementError);
          results.failed++;
          results.errors.push(`${merchant.business_name}: ${disbursementError.message}`);
          continue;
        }

        // Update escrow balance (move to pending or clear if completed)
        if (disbursementStatus === 'completed') {
          const { error: escrowError } = await supabase
            .from('escrow_accounts')
            .update({ balance: 0 })
            .eq('id', escrowAccount.id);

          if (escrowError) {
            console.error(`Error updating escrow for ${merchant.business_name}:`, escrowError);
          }

          // Update merchant stats
          await supabase
            .from('merchants')
            .update({
              total_disbursed: (merchant.total_disbursed || 0) + netAmount,
              last_disbursement_date: now.toISOString(),
            })
            .eq('id', merchant.id);
        } else {
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
        }

        // Create escrow transaction record
        await supabase
          .from('escrow_transactions')
          .insert({
            escrow_account_id: escrowAccount.id,
            amount: -amount,
            type: 'disbursement',
            status: disbursementStatus === 'completed' ? 'completed' : 'processing',
            description: `Scheduled ${disbursementSchedule} disbursement${feeAmount > 0 ? ` (fee: Rp ${feeAmount.toLocaleString()})` : ''}`,
            reference: disbursement.id,
          });

        // Create notification for merchant
        await supabase
          .from('notifications')
          .insert({
            user_id: merchant.user_id,
            title: disbursementStatus === 'completed' ? 'Disbursement Completed' : 'Disbursement Processing',
            message: disbursementStatus === 'completed' 
              ? `Your disbursement of Rp ${netAmount.toLocaleString()} has been transferred.`
              : `A disbursement of Rp ${netAmount.toLocaleString()} is being processed to your account.`,
            type: 'payment',
            link: '/merchant/escrow',
          });

        // Send processing email
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: disbursementStatus === 'completed' ? 'disbursement_success' : 'disbursement_processing',
              recipientEmail: '',
              recipientName: merchant.business_name,
              data: {
                amount: netAmount,
                bankName: primaryBankAccount.bank_name,
                accountName: primaryBankAccount.account_name,
                accountNumber: primaryBankAccount.account_number,
                reference: externalId,
                expectedDate: '1-2 business days',
                completedAt: new Date().toLocaleDateString('id-ID'),
              },
            },
          });
        } catch (emailError) {
          console.error(`Failed to send email for ${merchant.business_name}:`, emailError);
        }

        results.processed++;
        results.totalAmount += netAmount;

        console.log(`Successfully processed disbursement for ${merchant.business_name}`);

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
