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

    // ===== PART 1: CHECK INVOICES DUE TODAY =====
    console.log('Checking for invoices due today...');

    const { data: invoicesDueToday, error: dueTodayError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        amount,
        total_amount,
        tenant_user_id,
        merchant_id
      `)
      .eq('status', 'pending')
      .eq('due_date', todayDateStr);

    if (!dueTodayError && invoicesDueToday?.length) {
      console.log(`Found ${invoicesDueToday.length} invoices due today`);
      for (const invoice of invoicesDueToday) {
        await supabase.from('notifications').insert({
          user_id: invoice.tenant_user_id,
          title: '⏰ Pembayaran Jatuh Tempo Hari Ini',
          message: `Invoice ${invoice.invoice_number} sebesar Rp ${Number(invoice.total_amount).toLocaleString('id-ID')} jatuh tempo hari ini. Segera lakukan pembayaran untuk menghindari denda.`,
          type: 'payment',
          link: '/tenant/invoices',
        });
      }
    }

    // ===== PART 2: PROCESS OVERDUE INVOICES WITH GRACE PERIOD =====
    console.log('Checking for overdue invoices...');

    // Get overdue invoices
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
        grace_period_active,
        overdue_since,
        late_fee_applied_at,
        contract_id,
        contract:contracts (
          grace_period_days,
          late_fee_type,
          late_payment_penalty_rate
        ),
        merchant:merchants (
          penalty_rate,
          user_id
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', todayDateStr)
      .is('payment_plan_id', null);

    if (overdueError) {
      console.error('Error fetching overdue invoices:', overdueError);
    } else {
      console.log(`Found ${overdueInvoices?.length || 0} overdue invoices`);

      for (const invoice of overdueInvoices || []) {
        try {
          const contractData = invoice.contract as unknown as { 
            grace_period_days: number | null; 
            late_fee_type: string | null;
            late_payment_penalty_rate: number | null;
          } | null;
          const merchantData = invoice.merchant as unknown as { 
            penalty_rate: number | null;
            user_id: string;
          } | null;

          const gracePeriodDays = contractData?.grace_period_days ?? 3;
          const lateFeeType = contractData?.late_fee_type || 'percentage';
          const penaltyRate = contractData?.late_payment_penalty_rate || merchantData?.penalty_rate || 0.02;

          const dueDate = new Date(invoice.due_date);
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          console.log(`Invoice ${invoice.invoice_number}: ${daysOverdue} days overdue, grace period: ${gracePeriodDays} days`);

          // Mark as overdue if not already
          if (!invoice.overdue_since) {
            await supabase
              .from('invoices')
              .update({
                overdue_since: today.toISOString(),
                grace_period_active: daysOverdue <= gracePeriodDays,
              })
              .eq('id', invoice.id);
          }

          // Within grace period
          if (daysOverdue <= gracePeriodDays) {
            if (!invoice.grace_period_active) {
              // Update grace period status
              await supabase
                .from('invoices')
                .update({ grace_period_active: true })
                .eq('id', invoice.id);
            }

            // Send grace period reminder
            const remainingGraceDays = gracePeriodDays - daysOverdue;
            await supabase.from('notifications').insert({
              user_id: invoice.tenant_user_id,
              title: '⚠️ Pembayaran Terlambat - Masa Tenggang',
              message: `Invoice ${invoice.invoice_number} telah melewati jatuh tempo. Sisa masa tenggang: ${remainingGraceDays} hari. Segera bayar untuk menghindari denda Rp ${Math.round(invoice.amount * penaltyRate).toLocaleString('id-ID')}.`,
              type: 'payment',
              link: '/tenant/invoices',
            });

            console.log(`Invoice ${invoice.invoice_number}: In grace period, ${remainingGraceDays} days remaining`);
          } 
          // Grace period expired - apply late fee
          else if (!invoice.late_fee_applied_at) {
            let lateFee = 0;
            let calculationMethod = '';

            switch (lateFeeType) {
              case 'fixed':
                lateFee = 50000; // Fixed Rp 50,000
                calculationMethod = 'fixed_50000';
                break;
              case 'progressive':
                lateFee = daysOverdue * 10000; // Rp 10,000 per day
                calculationMethod = `progressive_${daysOverdue}days_10000perday`;
                break;
              case 'percentage':
              default:
                lateFee = Math.round(invoice.amount * penaltyRate);
                calculationMethod = `percentage_${penaltyRate * 100}%`;
                break;
            }

            const newTotalAmount = invoice.amount + lateFee;

            console.log(`Applying late fee to invoice ${invoice.invoice_number}: ${lateFee} (${calculationMethod})`);

            // Update invoice with late fee
            await supabase
              .from('invoices')
              .update({
                late_fee: lateFee,
                total_amount: newTotalAmount,
                original_amount: invoice.amount,
                late_fee_applied_at: today.toISOString(),
                grace_period_active: false,
              })
              .eq('id', invoice.id);

            // Create late fee record for audit trail
            await supabase.from('late_fee_records').insert({
              invoice_id: invoice.id,
              original_amount: invoice.amount,
              late_fee_amount: lateFee,
              days_overdue: daysOverdue,
              calculation_method: calculationMethod,
            });

            // Notify tenant about late fee
            await supabase.from('notifications').insert({
              user_id: invoice.tenant_user_id,
              title: '🚨 Denda Keterlambatan Diterapkan',
              message: `Invoice ${invoice.invoice_number} telah melewati jatuh tempo. Denda Rp ${lateFee.toLocaleString('id-ID')} telah ditambahkan. Total: Rp ${newTotalAmount.toLocaleString('id-ID')}. Segera bayar untuk menghindari tindakan lebih lanjut.`,
              type: 'payment',
              link: '/tenant/invoices',
            });

            // Notify merchant about late fee
            if (merchantData?.user_id) {
              await supabase.from('notifications').insert({
                user_id: merchantData.user_id,
                title: '💰 Denda Keterlambatan Diterapkan',
                message: `Denda Rp ${lateFee.toLocaleString('id-ID')} telah diterapkan pada invoice ${invoice.invoice_number}. Total tagihan: Rp ${newTotalAmount.toLocaleString('id-ID')}.`,
                type: 'payment',
                link: '/merchant/payments',
              });
            }

            console.log(`Late fee applied to invoice ${invoice.invoice_number}`);
          }

          // Check for collections escalation (15+ days overdue)
          if (daysOverdue >= 15 && invoice.late_fee_applied_at) {
            // Check if collections case already exists
            const { data: existingCase } = await supabase
              .from('collections_cases')
              .select('id')
              .eq('invoice_id', invoice.id)
              .single();

            if (!existingCase) {
              // Create collections case
              await supabase.from('collections_cases').insert({
                tenant_user_id: invoice.tenant_user_id,
                merchant_id: invoice.merchant_id,
                invoice_id: invoice.id,
                total_due: invoice.total_amount,
                days_overdue: daysOverdue,
                status: 'initiated',
                escalation_level: 1,
              });

              // Notify merchant about collections
              if (merchantData?.user_id) {
                await supabase.from('notifications').insert({
                  user_id: merchantData.user_id,
                  title: '⚠️ Kasus Penagihan Dibuat',
                  message: `Invoice ${invoice.invoice_number} telah melewati 15 hari dan masuk ke proses penagihan. Silakan hubungi penyewa atau pertimbangkan tindakan lebih lanjut.`,
                  type: 'system',
                  link: '/merchant/payments',
                });
              }

              console.log(`Collections case created for invoice ${invoice.invoice_number}`);
            }
          }
        } catch (err) {
          console.error(`Error processing invoice ${invoice.id}:`, err);
        }
      }
    }

    // ===== PART 3: GENERATE NEW INVOICES =====
    console.log('Checking contracts for invoice generation...');

    // Fetch all active contracts with their billing day
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
        grace_period_days,
        late_fee_type,
        late_payment_penalty_rate,
        unit:units (
          unit_number,
          property:properties (
            name
          )
        ),
        merchant:merchants (
          merchant_subscriptions (
            billing_day
          )
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
        // Determine billing day: contract billing_day > merchant_subscriptions billing_day > default 1
        const merchantData = contract.merchant as unknown as { merchant_subscriptions: { billing_day: number | null }[] | null } | null;
        const billingDay = contract.billing_day || merchantData?.merchant_subscriptions?.[0]?.billing_day || 1;

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
            grace_period_active: false,
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
      overdueProcessed: overdueInvoices?.length || 0,
      invoicesDueToday: invoicesDueToday?.length || 0,
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
