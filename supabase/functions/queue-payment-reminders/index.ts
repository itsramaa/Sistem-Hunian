import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderScheduleItem {
  days_overdue: number;
  channel: string;
  tone: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find all overdue invoices across all merchants
    const { data: overdueInvoices, error } = await supabase
      .from('invoices')
      .select(`
        id, merchant_id, tenant_user_id, invoice_number, total_amount, due_date, status
      `)
      .in('status', ['sent', 'overdue', 'escalated', 'partially_paid'])
      .lt('due_date', new Date().toISOString().split('T')[0]);

    if (error) throw error;
    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group by merchant
    const merchantInvoices = new Map<string, typeof overdueInvoices>();
    for (const inv of overdueInvoices) {
      const existing = merchantInvoices.get(inv.merchant_id) || [];
      existing.push(inv);
      merchantInvoices.set(inv.merchant_id, existing);
    }

    let totalProcessed = 0;

    for (const [merchantId, invoices] of merchantInvoices) {
      // Get merchant reminder config
      const { data: merchant } = await supabase
        .from('merchants')
        .select('collections_reminder_config')
        .eq('id', merchantId)
        .single();

      const config = merchant?.collections_reminder_config as { enabled: boolean; schedule: ReminderScheduleItem[] } | null;
      if (!config?.enabled) continue;

      const schedule = config.schedule || [];

      for (const inv of invoices) {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Find matching schedule entry
        const matchingStep = schedule
          .filter((s: ReminderScheduleItem) => s.days_overdue <= daysOverdue)
          .sort((a: ReminderScheduleItem, b: ReminderScheduleItem) => b.days_overdue - a.days_overdue)[0];

        if (!matchingStep) continue;

        // Check if we already sent this level of reminder
        const { data: existingReminder } = await supabase
          .from('payment_reminders_log')
          .select('id')
          .eq('invoice_id', inv.id)
          .eq('escalation_level', matchingStep.days_overdue)
          .limit(1);

        if (existingReminder && existingReminder.length > 0) continue;

        // Log the reminder (actual sending would integrate with email/SMS provider)
        await supabase.from('payment_reminders_log').insert({
          merchant_id: merchantId,
          invoice_id: inv.id,
          tenant_user_id: inv.tenant_user_id,
          reminder_type: matchingStep.tone,
          channel: matchingStep.channel,
          escalation_level: matchingStep.days_overdue,
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: {
            days_overdue: daysOverdue,
            invoice_number: inv.invoice_number,
            amount: inv.total_amount,
          },
        });

        // At T+15, auto-create collections case if none exists
        if (daysOverdue >= 15) {
          const { data: existingCase } = await supabase
            .from('collections_cases')
            .select('id')
            .eq('invoice_id', inv.id)
            .limit(1);

          if (!existingCase || existingCase.length === 0) {
            await supabase.from('collections_cases').insert({
              invoice_id: inv.id,
              merchant_id: merchantId,
              tenant_user_id: inv.tenant_user_id,
              status: 'initiated',
              days_overdue: daysOverdue,
              total_due: inv.total_amount,
              escalation_level: 1,
            });

            // Also escalate invoice
            if (inv.status === 'overdue') {
              await supabase
                .from('invoices')
                .update({ status: 'escalated' })
                .eq('id', inv.id);
            }
          }
        }

        totalProcessed++;
      }
    }

    return new Response(JSON.stringify({ processed: totalProcessed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
