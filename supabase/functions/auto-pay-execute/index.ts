import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TenantProfile {
  email: string;
  full_name: string;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_number: string;
  property: Property;
}

interface Contract {
  id: string;
  unit: Unit;
}

serve(async (req) => {
  console.log("Auto-pay execute function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayDay = today.getDate();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Running auto-pay for day ${todayDay}, date ${todayStr}`);

    // Find tenants with auto-pay enabled where auto_pay_day matches today
    const { data: tenantsWithAutoPay, error: tenantError } = await supabase
      .from('tenants')
      .select(`
        id,
        user_id,
        auto_pay_day,
        auto_pay_enabled,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq('auto_pay_enabled', true)
      .eq('auto_pay_day', todayDay);

    if (tenantError) {
      console.error("Error fetching tenants:", tenantError);
      throw tenantError;
    }

    console.log(`Found ${tenantsWithAutoPay?.length || 0} tenants with auto-pay enabled for day ${todayDay}`);

    const results = {
      processed: 0,
      invoicesCreated: 0,
      errors: [] as string[],
    };

    for (const tenant of tenantsWithAutoPay || []) {
      try {
        console.log(`Processing tenant ${tenant.user_id}`);

        // Find pending invoices for this tenant
        const { data: pendingInvoices, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            amount,
            total_amount,
            due_date,
            contract:contracts (
              id,
              unit:units (
                id,
                unit_number,
                property:properties (
                  id,
                  name
                )
              )
            )
          `)
          .eq('tenant_user_id', tenant.user_id)
          .eq('status', 'pending')
          .lte('due_date', todayStr)
          .order('due_date', { ascending: true });

        if (invoiceError) {
          console.error(`Error fetching invoices for tenant ${tenant.user_id}:`, invoiceError);
          results.errors.push(`Tenant ${tenant.user_id}: ${invoiceError.message}`);
          continue;
        }

        if (!pendingInvoices || pendingInvoices.length === 0) {
          console.log(`No pending invoices for tenant ${tenant.user_id}`);
          continue;
        }

        // Process each pending invoice
        for (const invoice of pendingInvoices) {
          try {
            const tenantProfile = tenant.profiles as unknown as TenantProfile;
            const tenantEmail = tenantProfile?.email;
            const tenantName = tenantProfile?.full_name || 'Tenant';
            const contract = invoice.contract as unknown as Contract;
            const unit = contract?.unit;
            const property = unit?.property;

            console.log(`Creating Xendit invoice for ${invoice.invoice_number}`);

            // Call xendit-create-invoice to create payment
            const { data: xenditResult, error: xenditError } = await supabase.functions.invoke('xendit-create-invoice', {
              body: {
                invoiceId: invoice.id,
                amount: invoice.total_amount || invoice.amount,
                payerEmail: tenantEmail,
                description: `Auto-Pay - ${invoice.invoice_number}`,
                paymentMethods: ['BANK_TRANSFER', 'EWALLET', 'QR_CODE'],
              },
            });

            if (xenditError) {
              console.error(`Error creating Xendit invoice for ${invoice.invoice_number}:`, xenditError);
              results.errors.push(`Invoice ${invoice.invoice_number}: ${xenditError.message}`);
              continue;
            }

            console.log(`Xendit invoice created:`, xenditResult);

            // Send notification email to tenant
            try {
              await supabase.functions.invoke('send-notification', {
                body: {
                  type: 'auto_pay_invoice',
                  recipientEmail: tenantEmail,
                  recipientName: tenantName,
                  data: {
                    invoiceNumber: invoice.invoice_number,
                    amount: invoice.total_amount || invoice.amount,
                    propertyName: property?.name || '',
                    unitNumber: unit?.unit_number || '',
                    dueDate: invoice.due_date,
                    paymentLink: xenditResult?.payment_url || '',
                  },
                },
              });
              console.log(`Auto-pay notification sent to ${tenantEmail}`);
            } catch (notifError) {
              console.error(`Error sending notification:`, notifError);
            }

            // Create in-app notification
            await supabase.from('notifications').insert({
              user_id: tenant.user_id,
              title: 'Auto-Pay: Invoice Ready',
              message: `Invoice ${invoice.invoice_number} sebesar Rp ${(invoice.total_amount || invoice.amount).toLocaleString('id-ID')} siap dibayar. Klik untuk membayar.`,
              type: 'payment',
              link: xenditResult?.payment_url || '/tenant/invoices',
            });

            results.invoicesCreated++;
          } catch (invoiceProcessError) {
            const err = invoiceProcessError as Error;
            console.error(`Error processing invoice ${invoice.invoice_number}:`, err);
            results.errors.push(`Invoice ${invoice.invoice_number}: ${err.message}`);
          }
        }

        results.processed++;
      } catch (tenantProcessError) {
        const err = tenantProcessError as Error;
        console.error(`Error processing tenant ${tenant.user_id}:`, err);
        results.errors.push(`Tenant ${tenant.user_id}: ${err.message}`);
      }
    }

    console.log("Auto-pay execution complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Auto-pay execution complete",
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    const err = error as Error;
    console.error("Error in auto-pay-execute function:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
