import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightOrError } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightOrError(req);
  if (corsResponse) return corsResponse;
  const headers = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

    // Get merchant_id
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: merchant } = await adminClient.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
    if (!merchant) return new Response(JSON.stringify({ error: "Merchant not found" }), { status: 404, headers });

    const merchantId = merchant.id;
    const now = new Date();
    const snapshotMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = `${snapshotMonth}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEnd = nextMonth.toISOString().split("T")[0];

    // Get all properties
    const { data: properties } = await adminClient.from("properties").select("id").eq("merchant_id", merchantId);
    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ message: "No properties found", inserted: 0 }), { headers });
    }

    const propertyIds = properties.map((p) => p.id);

    // Get all units grouped by property
    const { data: units } = await adminClient.from("units").select("id, property_id, status, rent_amount").in("property_id", propertyIds);

    // Get contracts starting/ending this month for move-in/move-out counts
    const { data: newContracts } = await adminClient
      .from("contracts")
      .select("unit_id, start_date, end_date, status")
      .in("unit_id", (units || []).map((u) => u.id))
      .gte("start_date", monthStart)
      .lt("start_date", monthEnd);

    const { data: endingContracts } = await adminClient
      .from("contracts")
      .select("unit_id, end_date, actual_end_date, status")
      .in("unit_id", (units || []).map((u) => u.id))
      .or(`and(end_date.gte.${monthStart},end_date.lt.${monthEnd}),and(actual_end_date.gte.${monthStart},actual_end_date.lt.${monthEnd})`);

    // Build snapshots
    const snapshots = propertyIds.map((propId) => {
      const propUnits = (units || []).filter((u) => u.property_id === propId);
      const total = propUnits.length;
      const occupied = propUnits.filter((u) => u.status === "occupied").length;
      const available = propUnits.filter((u) => u.status === "available").length;
      const maintenance = propUnits.filter((u) => u.status === "maintenance").length;
      const occupancyRate = total > 0 ? Math.round((occupied / total) * 100 * 100) / 100 : 0;
      const avgRent = total > 0 ? Math.round(propUnits.reduce((s, u) => s + (u.rent_amount || 0), 0) / total) : 0;

      const propUnitIds = new Set(propUnits.map((u) => u.id));
      const moveIns = (newContracts || []).filter((c) => propUnitIds.has(c.unit_id)).length;
      const moveOuts = (endingContracts || []).filter((c) => propUnitIds.has(c.unit_id) && (c.status === "terminated" || c.status === "expired")).length;

      return {
        merchant_id: merchantId,
        property_id: propId,
        snapshot_month: snapshotMonth,
        total_units: total,
        occupied_units: occupied,
        available_units: available,
        maintenance_units: maintenance,
        occupancy_rate: occupancyRate,
        avg_rent_amount: avgRent,
        new_move_ins: moveIns,
        move_outs: moveOuts,
      };
    });

    // Upsert (delete existing for this month, then insert)
    for (const snap of snapshots) {
      await adminClient
        .from("occupancy_snapshots")
        .delete()
        .eq("property_id", snap.property_id)
        .eq("snapshot_month", snap.snapshot_month);
    }

    const { error: insertErr } = await adminClient.from("occupancy_snapshots").insert(snapshots);
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true, inserted: snapshots.length, snapshot_month: snapshotMonth }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
});
