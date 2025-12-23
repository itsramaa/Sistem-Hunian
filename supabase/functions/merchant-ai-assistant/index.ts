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
    const { message, merchantId, userId } = await req.json();
    
    if (!merchantId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing merchantId or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Merchant AI: Processing query for merchant ${merchantId}: ${message}`);

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
        id, amount, due_date, invoice_number, tenant_user_id,
        contract:contracts(unit:units(unit_number, property:properties(name)))
      `)
      .eq("merchant_id", merchantId)
      .in("status", ["pending", "overdue"])
      .order("due_date", { ascending: true });

    // Fetch tenant profiles for unpaid invoices
    const unpaidTenantIds = unpaidInvoices?.map(i => i.tenant_user_id) || [];
    const { data: unpaidTenantProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", unpaidTenantIds);
    
    const tenantMap = new Map(unpaidTenantProfiles?.map(p => [p.user_id, p]) || []);

    // Fetch monthly revenue
    const { data: monthlyPayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("merchant_id", merchantId)
      .eq("status", "paid")
      .gte("paid_at", startOfMonth.toISOString())
      .lte("paid_at", endOfMonth.toISOString());

    const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

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
      .select("user_id, full_name")
      .in("user_id", expiringTenantIds);
    
    const expiringTenantMap = new Map(expiringTenantProfiles?.map(p => [p.user_id, p]) || []);

    // Fetch property occupancy
    const { data: properties } = await supabase
      .from("properties")
      .select("id, name, total_units, occupied_units")
      .eq("merchant_id", merchantId);

    const totalUnits = properties?.reduce((sum, p) => sum + (p.total_units || 0), 0) || 0;
    const occupiedUnits = properties?.reduce((sum, p) => sum + (p.occupied_units || 0), 0) || 0;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // Build context for AI
    const unpaidList = unpaidInvoices?.map(inv => {
      const tenant = tenantMap.get(inv.tenant_user_id);
      const contract = inv.contract as unknown as { unit: { unit_number: string; property: { name: string } } } | null;
      return `- ${tenant?.full_name || 'Unknown'}: Rp${Number(inv.amount).toLocaleString('id-ID')} (${contract?.unit?.property?.name || 'N/A'} Unit ${contract?.unit?.unit_number || 'N/A'}, due ${inv.due_date})`;
    }).join('\n') || 'Tidak ada';

    const expiringList = expiringContracts?.map(c => {
      const tenant = expiringTenantMap.get(c.tenant_user_id);
      const unit = c.unit as unknown as { unit_number: string; property: { name: string } } | null;
      return `- ${tenant?.full_name || 'Unknown'}: ${unit?.property?.name || 'N/A'} Unit ${unit?.unit_number || 'N/A'} (expires ${c.end_date})`;
    }).join('\n') || 'Tidak ada';

    const propertyList = properties?.map(p => 
      `- ${p.name}: ${p.occupied_units || 0}/${p.total_units || 0} units (${p.total_units ? Math.round(((p.occupied_units || 0) / p.total_units) * 100) : 0}%)`
    ).join('\n') || 'Tidak ada properti';

    const contextData = `
MERCHANT BUSINESS DATA (Current as of ${today.toLocaleDateString('id-ID')}):

📊 RINGKASAN:
- Total Revenue Bulan Ini: Rp${monthlyRevenue.toLocaleString('id-ID')}
- Occupancy Rate: ${occupancyRate}% (${occupiedUnits}/${totalUnits} units)
- Invoice Belum Dibayar: ${unpaidInvoices?.length || 0}
- Kontrak Expiring (30 hari): ${expiringContracts?.length || 0}

💰 INVOICE BELUM DIBAYAR:
${unpaidList}

📅 KONTRAK AKAN BERAKHIR (30 hari):
${expiringList}

🏠 PROPERTI:
${propertyList}
`;

    const systemPrompt = `Kamu adalah asisten bisnis AI untuk merchant properti di platform SiHuni. 
Tugasmu adalah membantu merchant dengan informasi bisnis mereka.

${contextData}

INSTRUKSI:
- Jawab dalam Bahasa Indonesia yang sopan dan profesional
- Gunakan data aktual di atas untuk menjawab pertanyaan
- Format angka currency dengan Rp dan pemisah ribuan (contoh: Rp1.500.000)
- Jika ditanya sesuatu yang tidak ada datanya, sampaikan bahwa informasi tidak tersedia
- Berikan saran praktis jika relevan
- Jawab dengan ringkas dan to the point`;

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
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ response: "Maaf, sistem sedang sibuk. Silakan coba lagi dalam beberapa saat." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ response: "Maaf, layanan AI sementara tidak tersedia." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "Maaf, saya tidak bisa memproses permintaan Anda.";

    console.log(`Merchant AI: Response generated for merchant ${merchantId}`);

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Merchant AI error:", error);
    return new Response(
      JSON.stringify({ 
        response: "Maaf, terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi.",
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
