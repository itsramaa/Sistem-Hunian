import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    console.log('Starting payment plan compliance check...');

    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];

    // ===== PART 1: CHECK FOR DUE INSTALLMENTS =====
    console.log('Checking for installments due today...');

    const { data: dueInstallments, error: dueError } = await supabase
      .from('payment_plan_installments')
      .select(`
        id,
        payment_plan_id,
        installment_number,
        amount,
        due_date,
        status,
        payment_plan:payment_plans (
          id,
          invoice_id,
          tenant_user_id,
          merchant_id,
          original_amount,
          installment_count,
          status
        )
      `)
      .eq('status', 'pending')
      .eq('due_date', todayDateStr);

    if (!dueError && dueInstallments?.length) {
      console.log(`Found ${dueInstallments.length} installments due today`);

      for (const installment of dueInstallments) {
        const planData = installment.payment_plan as unknown as {
          id: string;
          invoice_id: string;
          tenant_user_id: string;
          merchant_id: string;
          original_amount: number;
          installment_count: number;
          status: string;
        } | null;

        if (planData) {
          await supabase.from('notifications').insert({
            user_id: planData.tenant_user_id,
            title: '📅 Cicilan Jatuh Tempo Hari Ini',
            message: `Cicilan ke-${installment.installment_number} sebesar ${formatCurrency(installment.amount)} jatuh tempo hari ini. Segera lakukan pembayaran.`,
            type: 'payment',
            link: '/tenant/invoices',
          });
        }
      }
    }

    // ===== PART 2: CHECK FOR OVERDUE INSTALLMENTS =====
    console.log('Checking for overdue installments...');

    const { data: overdueInstallments, error: overdueError } = await supabase
      .from('payment_plan_installments')
      .select(`
        id,
        payment_plan_id,
        installment_number,
        amount,
        due_date,
        status,
        payment_plan:payment_plans (
          id,
          invoice_id,
          tenant_user_id,
          merchant_id,
          original_amount,
          installment_count,
          status,
          invoice:invoices (
            id,
            invoice_number,
            total_amount
          )
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', todayDateStr);

    if (overdueError) {
      console.error('Error fetching overdue installments:', overdueError);
    } else {
      console.log(`Found ${overdueInstallments?.length || 0} overdue installments`);

      for (const installment of overdueInstallments || []) {
        const planData = installment.payment_plan as unknown as {
          id: string;
          invoice_id: string;
          tenant_user_id: string;
          merchant_id: string;
          original_amount: number;
          installment_count: number;
          status: string;
          invoice: {
            id: string;
            invoice_number: string;
            total_amount: number;
          } | null;
        } | null;

        if (!planData || planData.status === 'defaulted') {
          continue;
        }

        const dueDate = new Date(installment.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Default the plan after 7 days overdue on any installment
        if (daysOverdue >= 7) {
          console.log(`Defaulting payment plan ${planData.id} - installment ${daysOverdue} days overdue`);

          // Update payment plan to defaulted
          await supabase
            .from('payment_plans')
            .update({
              status: 'defaulted',
              defaulted_at: today.toISOString(),
            })
            .eq('id', planData.id);

          // Revert invoice to pending for normal collection
          await supabase
            .from('invoices')
            .update({
              status: 'pending',
            })
            .eq('id', planData.invoice_id);

          // Notify tenant
          await supabase.from('notifications').insert({
            user_id: planData.tenant_user_id,
            title: '❌ Rencana Cicilan Dibatalkan',
            message: `Rencana cicilan untuk invoice ${planData.invoice?.invoice_number || ''} telah dibatalkan karena cicilan tidak dibayar. Tagihan penuh kembali berlaku.`,
            type: 'payment',
            link: '/tenant/invoices',
          });

          // Get merchant user_id
          const { data: merchant } = await supabase
            .from('merchants')
            .select('user_id')
            .eq('id', planData.merchant_id)
            .single();

          if (merchant?.user_id) {
            await supabase.from('notifications').insert({
              user_id: merchant.user_id,
              title: '❌ Cicilan Gagal - Kembali ke Penagihan',
              message: `Penyewa gagal memenuhi rencana cicilan untuk invoice ${planData.invoice?.invoice_number || ''}. Invoice kembali ke proses penagihan normal.`,
              type: 'system',
              link: '/merchant/payments',
            });
          }
        } else {
          // Send daily reminder for overdue installment
          await supabase.from('notifications').insert({
            user_id: planData.tenant_user_id,
            title: '⚠️ Cicilan Terlambat',
            message: `Cicilan ke-${installment.installment_number} telah terlambat ${daysOverdue} hari. Segera bayar untuk menghindari pembatalan rencana cicilan.`,
            type: 'payment',
            link: '/tenant/invoices',
          });
        }
      }
    }

    // ===== PART 3: CHECK FOR COMPLETED PAYMENT PLANS =====
    console.log('Checking for completed payment plans...');

    const { data: activePlans, error: plansError } = await supabase
      .from('payment_plans')
      .select(`
        id,
        invoice_id,
        tenant_user_id,
        merchant_id,
        installment_count,
        invoice:invoices (
          id,
          invoice_number
        )
      `)
      .eq('status', 'accepted');

    if (!plansError && activePlans?.length) {
      for (const plan of activePlans) {
        // Check if all installments are paid
        const { data: pendingInstallments } = await supabase
          .from('payment_plan_installments')
          .select('id')
          .eq('payment_plan_id', plan.id)
          .eq('status', 'pending');

        if (!pendingInstallments?.length) {
          console.log(`Payment plan ${plan.id} completed - all installments paid`);

          // Mark plan as completed
          await supabase
            .from('payment_plans')
            .update({
              status: 'completed',
              completed_at: today.toISOString(),
            })
            .eq('id', plan.id);

          // Mark original invoice as paid
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: today.toISOString(),
            })
            .eq('id', plan.invoice_id);

          // Resolve any collections case
          await supabase
            .from('collections_cases')
            .update({
              status: 'resolved',
              resolved_at: today.toISOString(),
              resolution_type: 'payment_plan_completed',
            })
            .eq('invoice_id', plan.invoice_id);

          const invoiceData = plan.invoice as unknown as { invoice_number: string } | null;

          // Notify tenant
          await supabase.from('notifications').insert({
            user_id: plan.tenant_user_id,
            title: '🎉 Cicilan Selesai!',
            message: `Selamat! Anda telah menyelesaikan semua cicilan untuk invoice ${invoiceData?.invoice_number || ''}. Invoice telah ditandai lunas.`,
            type: 'payment',
            link: '/tenant/invoices',
          });

          // Get merchant user_id
          const { data: merchant } = await supabase
            .from('merchants')
            .select('user_id')
            .eq('id', plan.merchant_id)
            .single();

          if (merchant?.user_id) {
            await supabase.from('notifications').insert({
              user_id: merchant.user_id,
              title: '✅ Cicilan Penyewa Selesai',
              message: `Penyewa telah menyelesaikan semua cicilan untuk invoice ${invoiceData?.invoice_number || ''}.`,
              type: 'payment',
              link: '/merchant/payments',
            });
          }
        }
      }
    }

    const result = {
      success: true,
      dueInstallments: dueInstallments?.length || 0,
      overdueInstallments: overdueInstallments?.length || 0,
      activePlansChecked: activePlans?.length || 0,
      processedAt: new Date().toISOString(),
    };

    console.log('Payment plan compliance check completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Payment plan compliance check failed:', error);
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
