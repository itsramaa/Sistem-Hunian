import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ENTITIES: Record<string, { table: string; merchantField: string }> = {
  properties: { table: "properties", merchantField: "merchant_id" },
  units: { table: "units", merchantField: "property_id" },
  payments: { table: "payments", merchantField: "merchant_id" },
  contracts: { table: "contracts", merchantField: "merchant_id" },
  invoices: { table: "invoices", merchantField: "merchant_id" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get merchant_id
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!merchant) {
      return new Response(JSON.stringify({ error: "Merchant not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const entity = url.searchParams.get("entity");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("page_size") || "50")));

    if (!entity || !ALLOWED_ENTITIES[entity]) {
      return new Response(
        JSON.stringify({ error: "Invalid entity. Allowed: " + Object.keys(ALLOWED_ENTITIES).join(", ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = ALLOWED_ENTITIES[entity];
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from(config.table).select("*", { count: "exact" });

    // Scope to merchant
    if (entity === "units") {
      // Units are scoped via property_id → properties.merchant_id
      const { data: propIds } = await supabase
        .from("properties")
        .select("id")
        .eq("merchant_id", merchant.id);
      const ids = (propIds || []).map((p: { id: string }) => p.id);
      query = query.in("property_id", ids.length > 0 ? ids : ["__none__"]);
    } else {
      query = query.eq(config.merchantField, merchant.id);
    }

    // Apply optional filters from query params
    const filterKeys = url.searchParams.get("filter_keys")?.split(",") || [];
    const filterValues = url.searchParams.get("filter_values")?.split(",") || [];
    filterKeys.forEach((key, i) => {
      if (key && filterValues[i]) {
        query = query.eq(key, filterValues[i]);
      }
    });

    query = query.range(from, to).order("created_at", { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        data: data || [],
        meta: {
          page,
          page_size: pageSize,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / pageSize),
          exported_at: new Date().toISOString(),
          exported_by: user.email,
          entity,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
