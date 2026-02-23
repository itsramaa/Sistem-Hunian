import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, message, merchantId, userId } = await req.json();
    
    // Support both streaming (messages array) and non-streaming (message string)
    const userMessages = messages || [{ role: "user", content: message }];
    const latestMessage = userMessages[userMessages.length - 1]?.content || message || "";

    if (!merchantId) {
      return new Response(
        JSON.stringify({ error: "Missing merchantId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Merchant AI: Processing for merchant ${merchantId}: ${latestMessage.substring(0, 50)}...`);

    // Fetch merchant context data
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Fetch unpaid invoices
    const { data: unpaidInvoices } = await supabase
      .from("invoices")
      .select(`
        id, amount, due_date, invoice_number, tenant_user_id, status,
        contract:contracts(unit:units(unit_number, property:properties(name)))
      `)
      .eq("merchant_id", merchantId)
      .in("status", ["pending", "overdue"])
      .order("due_date", { ascending: true });

    // Fetch tenant profiles for unpaid invoices
    const unpaidTenantIds = unpaidInvoices?.map(i => i.tenant_user_id) || [];
    const { data: unpaidTenantProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, phone")
      .in("user_id", unpaidTenantIds);
    
    const tenantMap = new Map(unpaidTenantProfiles?.map(p => [p.user_id, p]) || []);

    // Fetch monthly revenue for last 6 months for prediction
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const { data: revenueHistory } = await supabase
      .from("payments")
      .select("amount, paid_at")
      .eq("merchant_id", merchantId)
      .eq("status", "paid")
      .gte("paid_at", sixMonthsAgo.toISOString());

    // Calculate monthly revenue breakdown
    const monthlyRevenue: Record<string, number> = {};
    revenueHistory?.forEach(p => {
      const month = new Date(p.paid_at).toISOString().substring(0, 7);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(p.amount);
    });

    const currentMonthRevenue = monthlyRevenue[today.toISOString().substring(0, 7)] || 0;
    const revenueValues = Object.values(monthlyRevenue);
    const avgMonthlyRevenue = revenueValues.length > 0 
      ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length 
      : 0;

    // Simple prediction: average + trend
    const sortedMonths = Object.keys(monthlyRevenue).sort();
    let trend = 0;
    if (sortedMonths.length >= 2) {
      const recent = monthlyRevenue[sortedMonths[sortedMonths.length - 1]] || 0;
      const previous = monthlyRevenue[sortedMonths[sortedMonths.length - 2]] || 0;
      trend = recent - previous;
    }
    const predictedNextMonth = Math.max(0, avgMonthlyRevenue + trend);

    // Fetch expiring contracts
    const { data: expiringContracts } = await supabase
      .from("contracts")
      .select(`
        id, end_date, tenant_user_id, rent_amount,
        unit:units(unit_number, property:properties(name))
      `)
      .eq("merchant_id", merchantId)
      .eq("status", "active")
      .lte("end_date", thirtyDaysFromNow.toISOString().split("T")[0])
      .gte("end_date", today.toISOString().split("T")[0]);

    // Fetch expiring tenant profiles
    const expiringTenantIds = expiringContracts?.map(c => c.tenant_user_id) || [];
    const { data: expiringTenantProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone")
      .in("user_id", expiringTenantIds);
    
    const expiringTenantMap = new Map(expiringTenantProfiles?.map(p => [p.user_id, p]) || []);

    // Fetch property occupancy
    const { data: properties } = await supabase
      .from("properties")
      .select("id, name, total_units, occupied_units, construction_cost, renovation_cost, monthly_amortization, security_score, disaster_risk_level")
      .eq("merchant_id", merchantId);

    const totalUnits = properties?.reduce((sum, p) => sum + (p.total_units || 0), 0) || 0;
    const occupiedUnits = properties?.reduce((sum, p) => sum + (p.occupied_units || 0), 0) || 0;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // Phase 6: Fetch guardian, risk, insurance, compliance, security, tenant metrics, occupancy snapshots
    const propertyIds = properties?.map(p => p.id) || [];

    const [guardiansRes, riskProfilesRes, insuranceRes, complianceRes, incidentsRes, tenantMetricsRes, occupancySnapsRes] = await Promise.all([
      supabase.from("property_guardians").select("id, property_id, salary, status").eq("merchant_id", merchantId).eq("status", "active"),
      supabase.from("disaster_risk_profiles").select("property_id, overall_risk_score, risk_zone").eq("merchant_id", merchantId),
      supabase.from("insurance_policies").select("property_id, provider, coverage_amount, status, end_date").eq("merchant_id", merchantId).eq("status", "active"),
      supabase.from("compliance_documents").select("property_id, document_type, status, expiry_date").eq("merchant_id", merchantId),
      supabase.from("security_incidents").select("property_id, incident_type, severity, status").eq("merchant_id", merchantId).eq("status", "open"),
      supabase.from("tenant_payment_metrics").select("tenant_user_id, payment_score, risk_level").eq("merchant_id", merchantId),
      supabase.from("occupancy_snapshots").select("month, occupancy_rate, move_ins, move_outs").eq("merchant_id", merchantId).order("month", { ascending: false }).limit(6),
    ]);

    const activeGuardians = guardiansRes.data || [];
    const totalGuardianSalary = activeGuardians.reduce((s, g) => s + (g.salary || 0), 0);
    const expiredDocs = (complianceRes.data || []).filter(d => d.expiry_date && new Date(d.expiry_date) < new Date());
    const expiringPolicies = (insuranceRes.data || []).filter(p => p.end_date && new Date(p.end_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const lowScoreTenants = (tenantMetricsRes.data || []).filter(t => t.payment_score < 50);

    // Calculate overdue days for each invoice
    const unpaidList = unpaidInvoices?.map(inv => {
      const tenant = tenantMap.get(inv.tenant_user_id);
      const contract = inv.contract as unknown as { unit: { unit_number: string; property: { name: string } } } | null;
      const dueDate = new Date(inv.due_date);
      const daysOverdue = inv.status === "overdue" 
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const overdueBadge = daysOverdue > 0 ? ` ⚠️ TERLAMBAT ${daysOverdue} hari` : "";
      return `- ${tenant?.full_name || 'Unknown'} (${contract?.unit?.property?.name || 'N/A'} Unit ${contract?.unit?.unit_number || 'N/A'})
  Rp${Number(inv.amount).toLocaleString('id-ID')} - Jatuh tempo: ${inv.due_date}${overdueBadge}
  [Kirim Reminder](/merchant/invoices/${inv.id})`;
    }).join('\n') || 'Tidak ada tagihan tertunggak';

    const expiringList = expiringContracts?.map(c => {
      const tenant = expiringTenantMap.get(c.tenant_user_id);
      const unit = c.unit as unknown as { unit_number: string; property: { name: string } } | null;
      const daysLeft = Math.floor((new Date(c.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return `- ${tenant?.full_name || 'Unknown'}: ${unit?.property?.name || 'N/A'} Unit ${unit?.unit_number || 'N/A'}
  Berakhir: ${c.end_date} (${daysLeft} hari lagi)
  Sewa: Rp${Number(c.rent_amount).toLocaleString('id-ID')}/bulan
  [Follow Up](/merchant/contracts/${c.id})`;
    }).join('\n') || 'Tidak ada kontrak yang akan berakhir';

    const propertyList = properties?.map(p => 
      `- ${p.name}: ${p.occupied_units || 0}/${p.total_units || 0} units (${p.total_units ? Math.round(((p.occupied_units || 0) / p.total_units) * 100) : 0}%)${p.disaster_risk_level ? ` | Risiko: ${p.disaster_risk_level}` : ''}${p.security_score ? ` | Keamanan: ${p.security_score}/100` : ''}`
    ).join('\n') || 'Tidak ada properti';

    // Revenue trend info
    const revenueTrendInfo = sortedMonths.map(month => {
      const [year, mon] = month.split('-');
      const monthName = new Date(parseInt(year), parseInt(mon) - 1).toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      return `${monthName}: Rp${monthlyRevenue[month].toLocaleString('id-ID')}`;
    }).join('\n');

    const contextData = `
DATA BISNIS MERCHANT (${today.toLocaleDateString('id-ID')}):

📊 RINGKASAN:
- Revenue Bulan Ini: Rp${currentMonthRevenue.toLocaleString('id-ID')}
- Rata-rata Revenue/Bulan: Rp${Math.round(avgMonthlyRevenue).toLocaleString('id-ID')}
- Prediksi Bulan Depan: Rp${Math.round(predictedNextMonth).toLocaleString('id-ID')}
- Occupancy Rate: ${occupancyRate}% (${occupiedUnits}/${totalUnits} units)
- Invoice Belum Dibayar: ${unpaidInvoices?.length || 0} (Total: Rp${unpaidInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0).toLocaleString('id-ID') || 0})
- Kontrak Akan Berakhir (30 hari): ${expiringContracts?.length || 0}

👮 PENJAGA PROPERTI:
- Penjaga Aktif: ${activeGuardians.length}
- Total Gaji Penjaga: Rp${totalGuardianSalary.toLocaleString('id-ID')}/bulan

🌊 RISIKO & KEPATUHAN:
- Profil Risiko: ${(riskProfilesRes.data || []).map(r => `${r.risk_zone} (skor ${r.overall_risk_score})`).join(', ') || 'Belum ada'}
- Polis Asuransi Aktif: ${(insuranceRes.data || []).length} (Coverage: Rp${(insuranceRes.data || []).reduce((s, p) => s + p.coverage_amount, 0).toLocaleString('id-ID')})
- Polis Akan Expired: ${expiringPolicies.length}
- Dokumen Expired: ${expiredDocs.length}
- Insiden Keamanan Terbuka: ${(incidentsRes.data || []).length}

👥 TENANT INSIGHTS:
- Tenant Skor Rendah (<50): ${lowScoreTenants.length}

📈 TREN REVENUE 6 BULAN:
${revenueTrendInfo || 'Belum ada data'}

📉 TREN OCCUPANCY:
${(occupancySnapsRes.data || []).map(s => `${s.month}: ${s.occupancy_rate}% (masuk: ${s.move_ins}, keluar: ${s.move_outs})`).join('\n') || 'Belum ada data'}

💰 INVOICE BELUM DIBAYAR:
${unpaidList}

📅 KONTRAK AKAN BERAKHIR:
${expiringList}

🏠 PROPERTI:
${propertyList}
`;

    const systemPrompt = `Kamu adalah asisten bisnis AI untuk merchant properti di platform SiHuni. 
Tugasmu adalah membantu merchant dengan informasi bisnis dan insight yang actionable.

${contextData}

INSTRUKSI:
- Jawab dalam Bahasa Indonesia yang sopan dan profesional
- Gunakan data aktual di atas untuk menjawab pertanyaan
- Format currency: Rp dengan pemisah ribuan (contoh: Rp1.500.000)
- Berikan insight dan saran praktis berdasarkan data
- Sertakan action button dengan format [Label](path) jika relevan:
  - Lihat detail invoice: [Lihat Invoice](/merchant/invoices)
  - Kirim reminder: [Kirim Reminder](/merchant/invoices)
  - Lihat kontrak: [Lihat Kontrak](/merchant/contracts)
  - Lihat laporan: [Lihat Laporan](/merchant/reports)
- Jika diminta prediksi, jelaskan basis analisisnya
- Jawab dengan ringkas tapi informatif
- Untuk data yang tidak tersedia, sampaikan dengan jelas`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    // Return streaming response
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Merchant AI error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Maaf, terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
