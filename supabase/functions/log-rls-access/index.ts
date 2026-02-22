import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      table_name,
      operation,
      user_id,
      user_role,
      was_denied,
      policy_name,
      error_message,
      request_metadata,
    } = body;

    if (!table_name || !operation) {
      return new Response(
        JSON.stringify({ error: "table_name and operation are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await serviceClient.from("rls_access_logs").insert({
      table_name,
      operation,
      user_id: user_id || null,
      user_role: user_role || null,
      was_denied: was_denied ?? false,
      policy_name: policy_name || null,
      error_message: error_message || null,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
      user_agent: req.headers.get("user-agent") || null,
      request_metadata: request_metadata || {},
    });

    if (error) {
      console.error("Failed to log RLS access:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── RLS Denial Alerting ──────────────────────────────────────────
    if (was_denied) {
      try {
        // Fetch active alert settings
        const { data: alertSettings } = await serviceClient
          .from("rls_alert_settings")
          .select("*")
          .eq("is_active", true);

        if (alertSettings && alertSettings.length > 0) {
          for (const setting of alertSettings) {
            const windowStart = new Date();
            windowStart.setMinutes(windowStart.getMinutes() - setting.window_minutes);

            // Check cooldown
            if (setting.last_alert_at) {
              const cooldownEnd = new Date(setting.last_alert_at);
              cooldownEnd.setMinutes(cooldownEnd.getMinutes() + setting.alert_cooldown_minutes);
              if (new Date() < cooldownEnd) continue;
            }

            // Count denials in window
            const { count } = await serviceClient
              .from("rls_access_logs")
              .select("id", { count: "exact", head: true })
              .eq("was_denied", true)
              .gte("created_at", windowStart.toISOString());

            if (count && count >= setting.denial_threshold) {
              // Get all admin user IDs
              const { data: adminRoles } = await serviceClient
                .from("user_roles")
                .select("user_id")
                .eq("role", "admin");

              if (adminRoles && adminRoles.length > 0) {
                const notifications = adminRoles.map((ar) => ({
                  user_id: ar.user_id,
                  title: "RLS Denial Spike Detected",
                  message: `${count} RLS denials in the last ${setting.window_minutes} minutes. Latest: table "${table_name}" (${operation}). Review security dashboard.`,
                  type: "rls_alert",
                  link: "/admin/dss-health",
                }));

                await serviceClient.from("notifications").insert(notifications);
              }

              // Update last_alert_at
              await serviceClient
                .from("rls_alert_settings")
                .update({ last_alert_at: new Date().toISOString() })
                .eq("id", setting.id);
            }
          }
        }
      } catch (alertErr) {
        console.error("Alert check failed (non-fatal):", alertErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("RLS logging error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
