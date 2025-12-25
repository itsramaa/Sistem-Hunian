import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatCurrency = (amount: number) => {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting overdue escalation check...');

    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];

    // Get all overdue invoices with their escalation status
    const { data: overdueInvoices, error: overdueError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        amount,
        total_amount,
        late_fee,
        due_date,
        tenant_user_id,
        merchant_id,
        overdue_since,
        grace_period_active,
        contract:contracts (
          unit:units (
            unit_number,
            property:properties (name)
          )
        ),
        merchant:merchants (
          user_id,
          business_name
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', todayDateStr)
      .is('payment_plan_id', null);

    if (overdueError) {
      console.error('Error fetching overdue invoices:', overdueError);
      throw overdueError;
    }

    console.log(`Found ${overdueInvoices?.length || 0} overdue invoices for escalation`);

    const escalations = {
      grace: 0,
      postGrace: 0,
      preCollection: 0,
      collection: 0,
    };

    for (const invoice of overdueInvoices || []) {
      try {
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        const contractData = invoice.contract as unknown as { 
          unit: { unit_number: string; property: { name: string } | null } | null 
        } | null;
        const merchantData = invoice.merchant as unknown as { 
          user_id: string; 
          business_name: string 
        } | null;

        const propertyName = contractData?.unit?.property?.name || 'Property';
        const unitNumber = contractData?.unit?.unit_number || '';

        // Get tenant profile for email
        const { data: tenantProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', invoice.tenant_user_id)
          .single();

        // Get merchant profile for email
        const { data: merchantProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', merchantData?.user_id || '')
          .single();

        // Determine escalation level and send appropriate notifications
        if (daysOverdue <= 3) {
          // Day 1-3: Grace period - daily reminder
          escalations.grace++;

          await supabase.from('notifications').insert({
            user_id: invoice.tenant_user_id,
            title: '⚠️ Pembayaran Dalam Masa Tenggang',
            message: `Invoice ${invoice.invoice_number} terlambat ${daysOverdue} hari. Sisa masa tenggang: ${3 - daysOverdue} hari. Bayar sekarang untuk menghindari denda.`,
            type: 'payment',
            link: '/tenant/invoices',
          });

          console.log(`[GRACE] Invoice ${invoice.invoice_number}: Day ${daysOverdue}`);

        } else if (daysOverdue <= 7) {
          // Day 4-7: Post-grace - twice daily (morning check)
          escalations.postGrace++;

          await supabase.from('notifications').insert({
            user_id: invoice.tenant_user_id,
            title: '🚨 Pembayaran Mendesak',
            message: `Invoice ${invoice.invoice_number} telah melewati masa tenggang. Total tagihan: ${formatCurrency(invoice.total_amount)}. Segera lakukan pembayaran.`,
            type: 'payment',
            link: '/tenant/invoices',
          });

          // Notify merchant
          if (merchantData?.user_id) {
            await supabase.from('notifications').insert({
              user_id: merchantData.user_id,
              title: '⚠️ Penyewa Terlambat Bayar',
              message: `Invoice ${invoice.invoice_number} untuk ${propertyName} - Unit ${unitNumber} telah terlambat ${daysOverdue} hari. Total: ${formatCurrency(invoice.total_amount)}.`,
              type: 'payment',
              link: '/merchant/payments',
            });
          }

          // Send email to tenant
          if (tenantProfile?.email && RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "SiHuni <onboarding@resend.dev>",
                to: [tenantProfile.email],
                subject: `🚨 Pembayaran Mendesak - Invoice ${invoice.invoice_number}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                      <h1 style="color: white; margin: 0;">⚠️ Pembayaran Mendesak</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                      <p>Hi ${tenantProfile.full_name || 'Penyewa'},</p>
                      <p>Invoice Anda telah melewati jatuh tempo dan masa tenggang.</p>
                      
                      <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                        <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
                        <p><strong>Properti:</strong> ${propertyName} - Unit ${unitNumber}</p>
                        <p><strong>Total Tagihan:</strong> ${formatCurrency(invoice.total_amount)}</p>
                        <p><strong>Terlambat:</strong> ${daysOverdue} hari</p>
                        ${invoice.late_fee ? `<p><strong>Denda:</strong> ${formatCurrency(invoice.late_fee)}</p>` : ''}
                      </div>
                      
                      <p style="color: #dc2626; font-weight: bold;">Segera lakukan pembayaran untuk menghindari tindakan lebih lanjut.</p>
                      
                      <a href="https://sihuni.id/tenant/invoices" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Bayar Sekarang</a>
                    </div>
                  </div>
                `,
              }),
            });
          }

          console.log(`[POST-GRACE] Invoice ${invoice.invoice_number}: Day ${daysOverdue}`);

        } else if (daysOverdue <= 14) {
          // Day 8-14: Pre-collection - escalate to merchant
          escalations.preCollection++;

          await supabase.from('notifications').insert({
            user_id: invoice.tenant_user_id,
            title: '🚨 PEMBERITAHUAN TERAKHIR',
            message: `Invoice ${invoice.invoice_number} telah melewati ${daysOverdue} hari. Ini adalah pemberitahuan terakhir sebelum proses penagihan. Total: ${formatCurrency(invoice.total_amount)}.`,
            type: 'payment',
            link: '/tenant/invoices',
          });

          // Escalate to merchant with action options
          if (merchantData?.user_id) {
            await supabase.from('notifications').insert({
              user_id: merchantData.user_id,
              title: '⚠️ Tindakan Diperlukan - Penagihan',
              message: `Invoice ${invoice.invoice_number} telah terlambat ${daysOverdue} hari. Pertimbangkan: hubungi penyewa, tawarkan cicilan, atau siapkan surat peringatan.`,
              type: 'system',
              link: '/merchant/payments',
            });
          }

          // Send final notice email to tenant
          if (tenantProfile?.email && RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "SiHuni <onboarding@resend.dev>",
                to: [tenantProfile.email],
                subject: `🚨 PEMBERITAHUAN TERAKHIR - Invoice ${invoice.invoice_number}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
                      <h1 style="color: white; margin: 0;">🚨 PEMBERITAHUAN TERAKHIR</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                      <p>Hi ${tenantProfile.full_name || 'Penyewa'},</p>
                      <p><strong>Ini adalah pemberitahuan terakhir sebelum proses penagihan.</strong></p>
                      
                      <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 2px solid #dc2626;">
                        <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
                        <p><strong>Total Tagihan:</strong> ${formatCurrency(invoice.total_amount)}</p>
                        <p><strong>Terlambat:</strong> ${daysOverdue} hari</p>
                      </div>
                      
                      <p style="color: #dc2626;">Tindakan segera diperlukan untuk menghindari:</p>
                      <ul style="color: #dc2626;">
                        <li>Pemutusan kontrak</li>
                        <li>Tindakan hukum</li>
                        <li>Biaya tambahan</li>
                      </ul>
                      
                      <a href="https://sihuni.id/tenant/invoices" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Bayar Segera</a>
                      <a href="mailto:support@sihuni.id" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; margin-left: 10px;">Hubungi Kami untuk Cicilan</a>
                    </div>
                  </div>
                `,
              }),
            });
          }

          // Send merchant action email
          if (merchantProfile?.email && RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "SiHuni <onboarding@resend.dev>",
                to: [merchantProfile.email],
                subject: `⚠️ Tindakan Diperlukan - Penagihan ${invoice.invoice_number}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                      <h1 style="color: white; margin: 0;">⚠️ Tindakan Diperlukan</h1>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                      <p>Hi ${merchantProfile.full_name || 'Merchant'},</p>
                      <p>Invoice berikut memerlukan tindakan penagihan:</p>
                      
                      <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                        <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
                        <p><strong>Properti:</strong> ${propertyName} - Unit ${unitNumber}</p>
                        <p><strong>Total:</strong> ${formatCurrency(invoice.total_amount)}</p>
                        <p><strong>Terlambat:</strong> ${daysOverdue} hari</p>
                      </div>
                      
                      <p><strong>Tindakan yang direkomendasikan:</strong></p>
                      <ol>
                        <li>Hubungi penyewa secara langsung</li>
                        <li>Tawarkan rencana cicilan</li>
                        <li>Siapkan surat peringatan resmi</li>
                      </ol>
                      
                      <a href="https://sihuni.id/merchant/payments" style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Buka Dashboard</a>
                    </div>
                  </div>
                `,
              }),
            });
          }

          console.log(`[PRE-COLLECTION] Invoice ${invoice.invoice_number}: Day ${daysOverdue}`);

        } else {
          // Day 15+: Collections process
          escalations.collection++;

          // Check/update collections case
          const { data: existingCase } = await supabase
            .from('collections_cases')
            .select('id, escalation_level')
            .eq('invoice_id', invoice.id)
            .single();

          if (existingCase) {
            // Update escalation level based on days overdue
            let newLevel = 1;
            if (daysOverdue >= 30) newLevel = 3;
            else if (daysOverdue >= 21) newLevel = 2;

            if (newLevel > existingCase.escalation_level) {
              await supabase
                .from('collections_cases')
                .update({ 
                  escalation_level: newLevel,
                  days_overdue: daysOverdue,
                })
                .eq('id', existingCase.id);

              // Notify merchant of escalation
              if (merchantData?.user_id) {
                await supabase.from('notifications').insert({
                  user_id: merchantData.user_id,
                  title: '⚠️ Eskalasi Penagihan Level ' + newLevel,
                  message: `Kasus penagihan untuk invoice ${invoice.invoice_number} telah dinaikkan ke level ${newLevel}. Pertimbangkan tindakan hukum.`,
                  type: 'system',
                  link: '/merchant/payments',
                });
              }
            }
          }

          console.log(`[COLLECTION] Invoice ${invoice.invoice_number}: Day ${daysOverdue}`);
        }
      } catch (err) {
        console.error(`Error processing escalation for invoice ${invoice.id}:`, err);
      }
    }

    const result = {
      success: true,
      processed: overdueInvoices?.length || 0,
      escalations,
      processedAt: new Date().toISOString(),
    };

    console.log('Overdue escalation check completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Overdue escalation check failed:', error);
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
