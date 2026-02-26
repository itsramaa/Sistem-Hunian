import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];
    let transitioned = 0;

    // 1. Transition sent/pending invoices past due_date -> overdue
    const { data: overdueInvoices, error: err1 } = await supabase
      .from("invoices")
      .select("id")
      .in("status", ["sent", "pending"])
      .lt("due_date", today);

    if (err1) throw err1;

    if (overdueInvoices && overdueInvoices.length > 0) {
      const ids = overdueInvoices.map((i: { id: string }) => i.id);
      const { error: updateErr } = await supabase
        .from("invoices")
        .update({ status: "overdue" })
        .in("id", ids);
      if (updateErr) throw updateErr;
      transitioned += ids.length;
      console.log(`Transitioned ${ids.length} invoices to overdue`);
    }

    // 2. Transition overdue invoices with 15+ days -> escalated
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const cutoffDate = fifteenDaysAgo.toISOString().split("T")[0];

    const { data: escalatedInvoices, error: err2 } = await supabase
      .from("invoices")
      .select("id")
      .eq("status", "overdue")
      .lt("due_date", cutoffDate);

    if (err2) throw err2;

    if (escalatedInvoices && escalatedInvoices.length > 0) {
      const ids = escalatedInvoices.map((i: { id: string }) => i.id);
      const { error: updateErr } = await supabase
        .from("invoices")
        .update({ status: "escalated" })
        .in("id", ids);
      if (updateErr) throw updateErr;
      transitioned += ids.length;
      console.log(`Transitioned ${ids.length} invoices to escalated`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transitioned,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auto-transition error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
