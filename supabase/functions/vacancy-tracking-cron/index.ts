import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting vacancy tracking cron...");

    // Get all vacant units with their details
    const { data: vacantUnits, error: unitsError } = await supabase
      .from("units")
      .select(`
        *,
        property:properties (
          id,
          name,
          merchant_id,
          merchant:merchants (
            user_id,
            business_name
          )
        )
      `)
      .eq("status", "vacant");

    if (unitsError) {
      throw unitsError;
    }

    console.log(`Found ${vacantUnits?.length || 0} vacant units`);

    const now = new Date();
    interface Notification {
      user_id: string;
      title: string;
      message: string;
      type: string;
      link: string;
    }
    const notifications: Notification[] = [];

    for (const unit of vacantUnits || []) {
      const vacantSince = unit.vacant_since ? new Date(unit.vacant_since) : null;
      
      if (!vacantSince) {
        // Set vacant_since if not set
        await supabase
          .from("units")
          .update({ vacant_since: now.toISOString() })
          .eq("id", unit.id);
        continue;
      }

      const daysVacant = Math.floor((now.getTime() - vacantSince.getTime()) / (1000 * 60 * 60 * 24));
      const monthlyRent = unit.rent_amount || 0;
      const dailyRent = monthlyRent / 30;
      const lostRevenue = Math.round(daysVacant * dailyRent);

      const merchantUserId = unit.property?.merchant?.user_id;
      
      if (!merchantUserId) continue;

      // Check for long vacancy alerts
      if (daysVacant === 30 || daysVacant === 60 || daysVacant === 90) {
        const alertLevel = daysVacant >= 60 ? "critical" : "warning";
        const title = daysVacant >= 60 
          ? `Critical: Unit ${unit.unit_number} vacant ${daysVacant} days`
          : `Alert: Unit ${unit.unit_number} vacant ${daysVacant} days`;

        notifications.push({
          user_id: merchantUserId,
          title,
          message: `Unit ${unit.unit_number} at ${unit.property?.name} has been vacant for ${daysVacant} days. Estimated lost revenue: Rp ${lostRevenue.toLocaleString()}`,
          type: alertLevel === "critical" ? "alert" : "warning",
          link: "/merchant/move-outs",
        });

        // Send email for critical vacancies
        if (daysVacant >= 60) {
          const { data: merchantProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", merchantUserId)
            .single();

          const { data: authUser } = await supabase.auth.admin.getUserById(merchantUserId);
          const merchantEmail = authUser?.user?.email || merchantProfile?.email;

          if (merchantEmail) {
            await supabase.functions.invoke("send-notification", {
              body: {
                type: "vacancy_alert",
                recipientEmail: merchantEmail,
                recipientName: merchantProfile?.full_name || "Merchant",
                data: {
                  unitNumber: unit.unit_number,
                  propertyName: unit.property?.name,
                  daysVacant,
                  lostRevenue,
                  monthlyRent,
                  suggestions: daysVacant >= 60 
                    ? ["Consider lowering rent price", "Offer first month free", "Update listing photos", "Consider property refresh"]
                    : ["Review listing visibility", "Check market competition"],
                },
              },
            });
          }
        }
      }

      // Weekly vacancy report (every Monday)
      if (now.getDay() === 1 && daysVacant > 7) {
        console.log(`Weekly report for unit ${unit.unit_number}: ${daysVacant} days vacant, lost Rp ${lostRevenue}`);
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
      console.log(`Created ${notifications.length} vacancy notifications`);
    }

    // Check for upcoming move-outs (7 days and 3 days before)
    const { data: upcomingMoveOuts } = await supabase
      .from("move_out_notices")
      .select(`
        *,
        contract:contracts (
          tenant_user_id,
          merchant_id,
          unit:units (
            unit_number,
            property:properties (name)
          )
        )
      `)
      .in("status", ["submitted", "acknowledged", "in_progress"])
      .gte("intended_move_out_date", now.toISOString().split("T")[0]);

    for (const moveOut of upcomingMoveOuts || []) {
      const moveOutDate = new Date(moveOut.intended_move_out_date);
      const daysUntilMoveOut = Math.floor((moveOutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilMoveOut === 7 || daysUntilMoveOut === 3 || daysUntilMoveOut === 1) {
        // Notify tenant
        await supabase.from("notifications").insert({
          user_id: moveOut.tenant_user_id,
          title: `Move-out in ${daysUntilMoveOut} day${daysUntilMoveOut > 1 ? "s" : ""}`,
          message: `Reminder: Your move-out from ${moveOut.contract?.unit?.property?.name} - Unit ${moveOut.contract?.unit?.unit_number} is scheduled for ${moveOut.intended_move_out_date}.`,
          type: "reminder",
          link: "/tenant/contracts",
        });

        // Notify merchant
        const { data: merchant } = await supabase
          .from("merchants")
          .select("user_id")
          .eq("id", moveOut.contract?.merchant_id)
          .single();

        if (merchant) {
          await supabase.from("notifications").insert({
            user_id: merchant.user_id,
            title: `Tenant move-out in ${daysUntilMoveOut} day${daysUntilMoveOut > 1 ? "s" : ""}`,
            message: `Reminder: Tenant at ${moveOut.contract?.unit?.property?.name} - Unit ${moveOut.contract?.unit?.unit_number} is moving out on ${moveOut.intended_move_out_date}.`,
            type: "reminder",
            link: "/merchant/move-outs",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        vacantUnits: vacantUnits?.length || 0,
        notificationsSent: notifications.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in vacancy tracking cron:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
