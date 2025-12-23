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
    const errors: string[] = [];

    for (const contract of activeContracts || []) {
      try {
        // Determine billing day: contract billing_day > merchant billing_day > default 1
        const merchantData = contract.merchant as unknown as { billing_day: number | null } | null;
        const billingDay = contract.billing_day || merchantData?.billing_day || 1;

        // Only generate invoice if today matches the billing day
        if (currentDay !== billingDay) {
          console.log(`Skipping contract ${contract.id}: billing day is ${billingDay}, today is ${currentDay}`);
          continue;
        }

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
            tax_amount: 0,
            total_amount: contract.rent_amount,
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
          title: 'New Invoice',
          message: `A new invoice (${newInvoice.invoice_number}) has been generated for your rent payment. Due date: ${dueDate.toLocaleDateString('id-ID')}`,
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
