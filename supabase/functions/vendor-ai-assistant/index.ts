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
    const { messages, vendorId, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get vendor context from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let vendorContext = "";
    
    if (vendorId) {
      // Fetch vendor data
      const { data: vendor } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", vendorId)
        .single();

      // Fetch products
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendorId);

      // Fetch recent orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch earnings
      const { data: earnings } = await supabase
        .from("vendor_earnings")
        .select("*")
        .eq("vendor_id", vendorId);

      // Calculate analytics
      const completedOrders = orders?.filter(o => o.status === "completed") || [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
      const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
      
      // Product performance
      const productSales: Record<string, { count: number; revenue: number }> = {};
      completedOrders.forEach(order => {
        if (!productSales[order.product_id]) {
          productSales[order.product_id] = { count: 0, revenue: 0 };
        }
        productSales[order.product_id].count++;
        productSales[order.product_id].revenue += order.total_price || 0;
      });

      const topProducts = products
        ?.map(p => ({
          name: p.name,
          category: p.category,
          price: p.price,
          sales: productSales[p.id]?.count || 0,
          revenue: productSales[p.id]?.revenue || 0,
          isAvailable: p.is_available,
          stock: p.stock,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Order trends
      const last30Days = orders?.filter(o => {
        const orderDate = new Date(o.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      });

      const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;
      const cancelledOrders = orders?.filter(o => o.status === "cancelled").length || 0;
      const completionRate = orders && orders.length > 0 
        ? ((completedOrders.length / orders.length) * 100).toFixed(1) 
        : "0";

      vendorContext = `
VENDOR BUSINESS CONTEXT:
- Business Name: ${vendor?.business_name || "Unknown"}
- Verification Status: ${vendor?.verification_status || "pending"}
- Service Categories: ${vendor?.service_categories?.join(", ") || "None set"}
- Rating: ${vendor?.rating || "No ratings yet"}

PRODUCT PORTFOLIO:
- Total Products: ${products?.length || 0}
- Active Products: ${products?.filter(p => p.is_available).length || 0}
- Categories: ${[...new Set(products?.map(p => p.category))].join(", ") || "None"}

TOP PERFORMING PRODUCTS:
${topProducts?.map(p => `- ${p.name} (${p.category}): ${p.sales} sales, Rp ${p.revenue.toLocaleString()}`).join("\n") || "No sales yet"}

SALES PERFORMANCE (Last 30 Days):
- Orders Received: ${last30Days?.length || 0}
- Completed Orders: ${completedOrders.length}
- Pending Orders: ${pendingOrders}
- Cancelled/Rejected: ${cancelledOrders}
- Completion Rate: ${completionRate}%
- Total Revenue: Rp ${totalRevenue.toLocaleString()}
- Average Order Value: Rp ${avgOrderValue.toLocaleString()}

EARNINGS:
- Total Earned: Rp ${earnings?.reduce((sum, e) => sum + e.net_amount, 0).toLocaleString() || 0}
- Pending Payout: Rp ${earnings?.filter(e => e.status === "pending").reduce((sum, e) => sum + e.net_amount, 0).toLocaleString() || 0}
`;
    }

    const systemPrompt = `You are an AI business advisor for vendors on Sihuni, a property management marketplace platform in Indonesia. Your role is to provide actionable business advice to help vendors grow their sales and improve their services.

${vendorContext}

GUIDELINES:
1. Give specific, actionable advice based on the vendor's actual data
2. Suggest product improvements or new products based on their category
3. Provide tips for improving ratings and customer satisfaction
4. Help with pricing strategies
5. Suggest ways to increase order completion rate
6. Recommend marketing strategies for the platform
7. Keep responses concise and practical
8. Use Indonesian Rupiah (Rp) for currency
9. Be encouraging but realistic

When analyzing performance:
- Compare their metrics to industry standards
- Identify areas for improvement
- Suggest specific actions they can take
- Consider seasonal trends for property services

For product recommendations:
- Look at their current categories
- Suggest complementary services
- Consider pricing gaps in their portfolio`;

    console.log("Calling Lovable AI Gateway for vendor assistant");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Vendor AI assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
