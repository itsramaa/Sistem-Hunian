import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto invoice generation...');

    // Get current date info
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const todayDateStr = today.toISOString().split('T')[0];

    // ===== PART 1: APPLY LATE FEES TO OVERDUE INVOICES =====
    console.log('Checking for overdue invoices to apply late fees...');

    // Get overdue invoices that haven't had late fee applied yet
    const { data: overdueInvoices, error: overdueError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        amount,
        total_amount,
        due_date,
        tenant_user_id,
        merchant_id,
        merchant:merchants (
          penalty_rate
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', todayDateStr)
      .is('late_fee_applied_at', null);

    if (overdueError) {
      console.error('Error fetching overdue invoices:', overdueError);
    } else {
      console.log(`Found ${overdueInvoices?.length || 0} overdue invoices without late fee`);

      for (const invoice of overdueInvoices || []) {
        try {
          const merchantData = invoice.merchant as unknown as { penalty_rate: number | null } | null;
          const penaltyRate = merchantData?.penalty_rate || 0.02; // Default 2%
          const lateFee = Math.round(invoice.amount * penaltyRate);
          const newTotalAmount = invoice.amount + lateFee;

          console.log(`Applying late fee to invoice ${invoice.invoice_number}: ${lateFee} (${penaltyRate * 100}%)`);

          // Update invoice with late fee
          await supabase
            .from('invoices')
            .update({
              late_fee: lateFee,
              total_amount: newTotalAmount,
              original_amount: invoice.amount,
              late_fee_applied_at: new Date().toISOString(),
            })
            .eq('id', invoice.id);

          // Notify tenant about late fee
          await supabase.from('notifications').insert({
            user_id: invoice.tenant_user_id,
            title: 'Denda Keterlambatan Diterapkan',
            message: `Invoice ${invoice.invoice_number} telah melewati jatuh tempo. Denda Rp ${lateFee.toLocaleString('id-ID')} (${penaltyRate * 100}%) telah ditambahkan. Total: Rp ${newTotalAmount.toLocaleString('id-ID')}`,
            type: 'payment',
            link: '/tenant/invoices',
          });

          console.log(`Late fee applied to invoice ${invoice.invoice_number}`);
        } catch (err) {
          console.error(`Error applying late fee to invoice ${invoice.id}:`, err);
        }
      }
    }

    // ===== PART 2: GENERATE NEW INVOICES =====
    console.log('Checking contracts for invoice generation...');

    // Fetch all active contracts with their billing day (contract level or merchant fallback)
    const { data: activeContracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        id,
        merchant_id,
        tenant_user_id,
        rent_amount,
        start_date,
        end_date,
        billing_day,
        unit:units (
          unit_number,
          property:properties (
            name
          )
        ),
        merchant:merchants (
          billing_day
        )
      `)
      .eq('status', 'active')
      .eq('signature_status', 'fully_signed');

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      throw contractsError;
    }

    console.log(`Found ${activeContracts?.length || 0} active contracts`);

    const invoicesCreated: string[] = [];
    const lateFeesApplied: string[] = [];
    const errors: string[] = [];

    for (const contract of activeContracts || []) {
      try {
        // Determine billing day: contract billing_day > merchant billing_day > default 1
        const merchantData = contract.merchant as unknown as { billing_day: number | null } | null;
        const billingDay = contract.billing_day || merchantData?.billing_day || 1;

        // Only generate invoice if today matches the billing day
        if (currentDay !== billingDay) {
          continue;
        }

        console.log(`Processing contract ${contract.id} (billing day: ${billingDay})`);

        // Check if invoice already exists for this contract and month
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);

        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('contract_id', contract.id)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
          .single();

        if (existingInvoice) {
          console.log(`Invoice already exists for contract ${contract.id} this month, skipping`);
          continue;
        }

        // Calculate due date (same billing day next month, or end of month if day doesn't exist)
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
        const dueDay = Math.min(billingDay, daysInNextMonth);
        const dueDate = new Date(nextYear, nextMonth, dueDay);

        // Create invoice
        const unitData = contract.unit as unknown as { unit_number: string; property: { name: string } | null } | null;
        const description = `Monthly rent for ${unitData?.property?.name || 'Property'} - Unit ${unitData?.unit_number || 'N/A'}`;

        const { data: newInvoice, error: insertError } = await supabase
          .from('invoices')
          .insert({
            contract_id: contract.id,
            merchant_id: contract.merchant_id,
            tenant_user_id: contract.tenant_user_id,
            amount: contract.rent_amount,
            original_amount: contract.rent_amount,
            tax_amount: 0,
            total_amount: contract.rent_amount,
            late_fee: 0,
            due_date: dueDate.toISOString().split('T')[0],
            description,
            status: 'pending',
            issued_at: new Date().toISOString(),
          })
          .select('id, invoice_number')
          .single();

        if (insertError) {
          console.error(`Error creating invoice for contract ${contract.id}:`, insertError);
          errors.push(`Contract ${contract.id}: ${insertError.message}`);
          continue;
        }

        invoicesCreated.push(newInvoice.invoice_number);
        console.log(`Created invoice ${newInvoice.invoice_number} for contract ${contract.id} (billing day: ${billingDay})`);

        // Create notification for tenant
        await supabase.from('notifications').insert({
          user_id: contract.tenant_user_id,
          title: 'Invoice Baru',
          message: `Invoice baru (${newInvoice.invoice_number}) telah diterbitkan untuk pembayaran sewa Anda. Jatuh tempo: ${dueDate.toLocaleDateString('id-ID')}`,
          type: 'payment',
          link: '/tenant/invoices',
        });

      } catch (err) {
        console.error(`Error processing contract ${contract.id}:`, err);
        errors.push(`Contract ${contract.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    const result = {
      success: true,
      invoicesCreated: invoicesCreated.length,
      invoiceNumbers: invoicesCreated,
      lateFeesApplied: overdueInvoices?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      processedAt: new Date().toISOString(),
    };

    console.log('Auto invoice generation completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Auto invoice generation failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
