import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const alerts: { days: number; type: string }[] = [
      { days: 60, type: '60_day_warning' },
      { days: 30, type: '30_day_warning' },
      { days: 7, type: '7_day_warning' },
    ];

    let totalCreated = 0;

    for (const alert of alerts) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + alert.days);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Find contracts ending on this exact date
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, merchant_id, tenant_user_id, end_date, rent_amount')
        .eq('status', 'active')
        .eq('end_date', dateStr);

      if (!contracts?.length) continue;

      for (const contract of contracts) {
        // Check if alert already sent
        const { data: existing } = await supabase
          .from('lease_renewal_alerts')
          .select('id')
          .eq('contract_id', contract.id)
          .eq('alert_type', alert.type)
          .limit(1);

        if (existing?.length) continue;

        // Create alert record
        await supabase.from('lease_renewal_alerts').insert({
          contract_id: contract.id,
          merchant_id: contract.merchant_id,
          alert_type: alert.type,
          alert_date: now.toISOString(),
          status: 'sent',
        });

        totalCreated++;
      }
    }

    return new Response(JSON.stringify({ success: true, alertsCreated: totalCreated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
