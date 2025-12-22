import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting payment reminder check...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Get payments due in 7 days, 3 days, or today
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        due_date,
        payment_type,
        tenant_user_id,
        contract:contracts(
          unit:units(
            unit_number,
            property:properties(name)
          )
        )
      `)
      .eq("status", "pending")
      .lte("due_date", sevenDaysFromNow.toISOString().split("T")[0])
      .gte("due_date", today.toISOString().split("T")[0]);

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      throw paymentsError;
    }

    console.log(`Found ${payments?.length || 0} payments due soon`);

    const sentReminders: string[] = [];
    const errors: string[] = [];

    for (const payment of payments || []) {
      // Get tenant profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", payment.tenant_user_id)
        .single();

      if (!profile?.email) {
        console.log(`No email found for tenant ${payment.tenant_user_id}`);
        continue;
      }

      const dueDate = new Date(payment.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let urgencyText = "";
      let subject = "";
      
      if (daysUntilDue <= 0) {
        urgencyText = "TODAY";
        subject = "⚠️ Payment Due Today";
      } else if (daysUntilDue <= 3) {
        urgencyText = `in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`;
        subject = `⏰ Payment Reminder - Due ${urgencyText}`;
      } else {
        urgencyText = `in ${daysUntilDue} days`;
        subject = `📅 Upcoming Payment Reminder`;
      }

      const contract = payment.contract as unknown as { unit: { unit_number: string; property: { name: string } } } | null;
      const propertyName = contract?.unit?.property?.name || "Your Property";
      const unitNumber = contract?.unit?.unit_number || "";

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SiHuni <onboarding@resend.dev>",
            to: [profile.email],
            subject: subject,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">SiHuni</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Payment Reminder</p>
              </div>
              
              <div style="padding: 30px; background: #f9fafb;">
                <p style="color: #374151; font-size: 16px;">
                  Hi ${profile.full_name || "Tenant"},
                </p>
                
                <p style="color: #374151; font-size: 16px;">
                  This is a reminder that your ${payment.payment_type} payment is due <strong>${urgencyText}</strong>.
                </p>
                
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Property:</td>
                      <td style="padding: 8px 0; font-weight: bold; text-align: right;">${propertyName}${unitNumber ? ` - Unit ${unitNumber}` : ""}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Amount Due:</td>
                      <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #059669;">
                        R ${Number(payment.amount).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
                      <td style="padding: 8px 0; font-weight: bold; text-align: right;">
                        ${new Date(payment.due_date).toLocaleDateString("en-ZA", { 
                          weekday: "long", 
                          year: "numeric", 
                          month: "long", 
                          day: "numeric" 
                        })}
                      </td>
                    </tr>
                  </table>
                </div>
                
                <p style="color: #374151; font-size: 14px;">
                  Please ensure your payment is made on time to avoid any late fees.
                </p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Thank you,<br>
                  The SiHuni Team
                </p>
              </div>
            </div>
          `,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log(`Reminder sent to ${profile.email}:`, emailResult);
        sentReminders.push(profile.email);

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: payment.tenant_user_id,
          title: subject,
          message: `Your ${payment.payment_type} payment of R${Number(payment.amount).toLocaleString()} is due ${urgencyText}.`,
          type: "payment",
          link: "/tenant/payments",
        });

      } catch (emailError) {
        console.error(`Failed to send reminder to ${profile.email}:`, emailError);
        errors.push(profile.email);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: sentReminders.length,
        emails: sentReminders,
        errors: errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: unknown) {
    console.error("Error in payment reminder function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
