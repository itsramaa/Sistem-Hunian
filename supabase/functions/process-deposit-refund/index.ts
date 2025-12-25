import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XENDIT_API_KEY = Deno.env.get("XENDIT_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { deposit_refund_id } = await req.json();

    if (!deposit_refund_id) {
      throw new Error("deposit_refund_id is required");
    }

    // Get deposit refund details
    const { data: refund, error: refundError } = await supabase
      .from("deposit_refunds")
      .select(`
        *,
        contract:contracts (
          tenant_user_id,
          unit:units (
            unit_number,
            property:properties (name)
          )
        )
      `)
      .eq("id", deposit_refund_id)
      .single();

    if (refundError || !refund) {
      throw new Error("Deposit refund not found");
    }

    if (refund.status === "refunded") {
      return new Response(
        JSON.stringify({ success: false, message: "Already refunded" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant profile for bank details and email
    const { data: tenantProfile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", refund.tenant_user_id)
      .single();

    // Get tenant's email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(refund.tenant_user_id);
    const tenantEmail = authUser?.user?.email || tenantProfile?.email;

    // Check if we have bank account details
    if (!refund.bank_name || !refund.bank_account_number || !refund.account_holder_name) {
      // Update status to pending bank details
      await supabase
        .from("deposit_refunds")
        .update({ status: "pending_bank_details" })
        .eq("id", deposit_refund_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Bank account details required from tenant" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase
      .from("deposit_refunds")
      .update({ status: "processing" })
      .eq("id", deposit_refund_id);

    // Create Xendit disbursement
    if (XENDIT_API_KEY) {
      const externalId = `DEPOSIT-REFUND-${deposit_refund_id}`;
      
      const disbursementPayload = {
        external_id: externalId,
        amount: refund.refund_amount,
        bank_code: refund.bank_name.toUpperCase().replace(/\s/g, "_"),
        account_holder_name: refund.account_holder_name,
        account_number: refund.bank_account_number,
        description: `Deposit refund for ${refund.contract?.unit?.property?.name} - Unit ${refund.contract?.unit?.unit_number}`,
      };

      const xenditResponse = await fetch("https://api.xendit.co/disbursements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(XENDIT_API_KEY + ":")}`,
        },
        body: JSON.stringify(disbursementPayload),
      });

      const xenditResult = await xenditResponse.json();

      if (!xenditResponse.ok) {
        console.error("Xendit error:", xenditResult);
        
        await supabase
          .from("deposit_refunds")
          .update({ status: "failed" })
          .eq("id", deposit_refund_id);

        throw new Error(xenditResult.message || "Xendit disbursement failed");
      }

      // Update with Xendit disbursement ID
      await supabase
        .from("deposit_refunds")
        .update({ 
          xendit_disbursement_id: xenditResult.id,
          status: "processing" 
        })
        .eq("id", deposit_refund_id);

      console.log("Xendit disbursement created:", xenditResult.id);
    } else {
      // Simulate for development without Xendit
      console.log("Simulating deposit refund (no Xendit API key)");
      
      await supabase
        .from("deposit_refunds")
        .update({ 
          status: "refunded",
          refunded_at: new Date().toISOString()
        })
        .eq("id", deposit_refund_id);

      // Update move-out timeline
      const { data: inspection } = await supabase
        .from("move_out_inspections")
        .select("move_out_notice_id")
        .eq("id", refund.inspection_id)
        .single();

      if (inspection) {
        await supabase
          .from("move_out_timeline")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("move_out_notice_id", inspection.move_out_notice_id)
          .eq("step", "deposit_returned");
      }

      // Send notification to tenant
      if (tenantEmail) {
        await supabase.functions.invoke("send-notification", {
          body: {
            type: "deposit_refunded",
            recipientEmail: tenantEmail,
            recipientName: tenantProfile?.full_name || "Tenant",
            data: {
              originalDeposit: refund.original_deposit,
              deductions: refund.deductions,
              refundAmount: refund.refund_amount,
              bankName: refund.bank_name,
              accountNumber: refund.bank_account_number?.slice(-4),
              propertyName: refund.contract?.unit?.property?.name,
              unitNumber: refund.contract?.unit?.unit_number,
            },
          },
        });
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id: refund.tenant_user_id,
        title: "Deposit Refunded",
        message: `Your security deposit of Rp ${refund.refund_amount.toLocaleString()} has been refunded.`,
        type: "deposit",
        link: "/tenant/contracts",
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Deposit refund processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing deposit refund:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
