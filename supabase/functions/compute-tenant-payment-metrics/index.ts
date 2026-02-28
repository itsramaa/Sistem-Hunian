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

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: merchant } = await adminClient.from("merchants").select("id").eq("user_id", user.id).maybeSingle();
    if (!merchant) return new Response(JSON.stringify({ error: "Merchant not found" }), { status: 404, headers });

    const merchantId = merchant.id;

    // Get all invoices for this merchant
    const { data: invoices } = await adminClient
      .from("invoices")
      .select("id, tenant_user_id, due_date, paid_at, status, amount, late_fee, created_at")
      .eq("merchant_id", merchantId)
      .order("due_date", { ascending: true });

    if (!invoices || invoices.length === 0) {
      return new Response(JSON.stringify({ message: "No invoices found", upserted: 0 }), { headers });
    }

    // Get contracts for tenure info
    const { data: contracts } = await adminClient
      .from("contracts")
      .select("tenant_user_id, start_date, end_date, status")
      .eq("merchant_id", merchantId);

    // Group invoices by tenant
    const tenantInvoices: Record<string, typeof invoices> = {};
    for (const inv of invoices) {
      if (!tenantInvoices[inv.tenant_user_id]) tenantInvoices[inv.tenant_user_id] = [];
      tenantInvoices[inv.tenant_user_id].push(inv);
    }

    const metrics = Object.entries(tenantInvoices).map(([tenantId, invs]) => {
      const total = invs.length;
      let paidOnTime = 0;
      let paidLate = 0;
      let unpaid = 0;
      let totalDaysLate = 0;
      let lateCount = 0;
      let totalLateFees = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Sort by due_date
      const sorted = [...invs].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      for (const inv of sorted) {
        if (inv.status === "paid" && inv.paid_at) {
          const dueDate = new Date(inv.due_date);
          const paidDate = new Date(inv.paid_at);
          const diffDays = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 0) {
            paidOnTime++;
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            paidLate++;
            totalDaysLate += diffDays;
            lateCount++;
            tempStreak = 0;
          }
        } else if (inv.status === "overdue" || inv.status === "unpaid") {
          unpaid++;
          tempStreak = 0;
        } else {
          // pending or other statuses - skip streak
        }
        totalLateFees += (inv.late_fee || 0);
      }
      currentStreak = tempStreak;

      const avgDaysLate = lateCount > 0 ? Math.round((totalDaysLate / lateCount) * 100) / 100 : 0;
      // Payment score: 100 * (on_time / total) with penalty for late
      const paymentScore = total > 0 ? Math.round((paidOnTime / total) * 100) : 0;

      // Tenure from contracts
      const tenantContracts = (contracts || []).filter((c) => c.tenant_user_id === tenantId);
      const renewalCount = Math.max(0, tenantContracts.length - 1);
      let totalTenureMonths = 0;
      for (const c of tenantContracts) {
        const start = new Date(c.start_date);
        const end = c.status === "active" ? new Date() : new Date(c.end_date);
        totalTenureMonths += Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      }

      const firstDate = sorted[0]?.created_at || null;
      const lastDate = sorted[sorted.length - 1]?.created_at || null;

      return {
        tenant_user_id: tenantId,
        merchant_id: merchantId,
        total_invoices: total,
        paid_on_time: paidOnTime,
        paid_late: paidLate,
        unpaid,
        avg_days_late: avgDaysLate,
        total_late_fees: totalLateFees,
        payment_score: paymentScore,
        longest_streak_on_time: longestStreak,
        current_streak_on_time: currentStreak,
        first_invoice_date: firstDate,
        last_invoice_date: lastDate,
        renewal_count: renewalCount,
        total_tenure_months: totalTenureMonths,
        calculated_at: new Date().toISOString(),
      };
    });

    // Upsert: delete existing for this merchant, then insert
    await adminClient.from("tenant_payment_metrics").delete().eq("merchant_id", merchantId);
    const { error: insertErr } = await adminClient.from("tenant_payment_metrics").insert(metrics);
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true, upserted: metrics.length }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers });
  }
});
