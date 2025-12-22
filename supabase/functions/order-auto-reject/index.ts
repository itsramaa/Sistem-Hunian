import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting order auto-reject CRON job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find orders that are pending for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: pendingOrders, error: fetchError } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        tenant_user_id,
        vendor_id,
        total_price,
        products (name),
        vendors (business_name)
      `)
      .eq("status", "pending")
      .lt("created_at", oneHourAgo);

    if (fetchError) {
      console.error("Error fetching pending orders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingOrders?.length || 0} orders to auto-reject`);

    if (!pendingOrders || pendingOrders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No orders to auto-reject",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const order of pendingOrders) {
      try {
        // Update order status to cancelled
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            cancel_reason: "Auto-rejected: Vendor did not respond within 1 hour",
            canceled_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updateError) {
          console.error(`Failed to update order ${order.order_number}:`, updateError);
          failed++;
          continue;
        }

        // Create notification for tenant
        const productName = Array.isArray(order.products) && order.products[0]?.name 
          ? order.products[0].name 
          : "your product";
          
        await supabase.from("notifications").insert({
          user_id: order.tenant_user_id,
          title: "Order Auto-Cancelled",
          message: `Your order #${order.order_number} for ${productName} was automatically cancelled because the vendor did not respond within 1 hour.`,
          type: "order",
          link: `/tenant/orders`,
        });

        // Check if there's a xendit transaction to refund
        const { data: transaction } = await supabase
          .from("xendit_transactions")
          .select("id, status")
          .eq("order_id", order.id)
          .eq("status", "PAID")
          .single();

        if (transaction) {
          // Mark transaction for refund (actual refund would be handled by Xendit)
          await supabase
            .from("xendit_transactions")
            .update({ status: "REFUND_PENDING" })
            .eq("id", transaction.id);

          console.log(`Order ${order.order_number} marked for refund`);
        }

        processed++;
        console.log(`Auto-rejected order ${order.order_number}`);
      } catch (orderError) {
        console.error(`Error processing order ${order.order_number}:`, orderError);
        failed++;
      }
    }

    console.log(`Completed: ${processed} processed, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-rejected ${processed} orders`,
        processed,
        failed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Order auto-reject CRON error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});