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

    console.log(`Vendor AI: Processing for vendor ${vendorId}`);

    let vendorContext = "";
    
    if (vendorId) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

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

      // Fetch maintenance requests that match vendor categories
      const { data: maintenanceOpportunities } = await supabase
        .from("maintenance_requests")
        .select("id, title, category, priority, status, created_at, unit_id")
        .in("status", ["pending", "open"])
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch assigned property vendor services
      const { data: assignedServices } = await supabase
        .from("property_vendor_services")
        .select("id, service_type, status, monthly_fee, property:properties(name)")
        .eq("vendor_id", vendorId)
        .eq("status", "active");

      // Fetch all orders for this vendor
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      // Fetch reviews
      const { data: reviews } = await supabase
        .from("order_reviews")
        .select("rating, review_text, created_at")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Calculate analytics
      const completedOrders = orders?.filter(o => o.status === "completed") || [];
      const recentOrders = orders?.filter(o => new Date(o.created_at) >= thirtyDaysAgo) || [];
      const recentCompleted = recentOrders.filter(o => o.status === "completed");
      
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
      const recentRevenue = recentCompleted.reduce((sum, o) => sum + (o.total_price || 0), 0);
      const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
      
      // Product performance
      const productSales: Record<string, { count: number; revenue: number; name: string }> = {};
      completedOrders.forEach(order => {
        if (!productSales[order.product_id]) {
          const product = products?.find(p => p.id === order.product_id);
          productSales[order.product_id] = { count: 0, revenue: 0, name: product?.name || "Unknown" };
        }
        productSales[order.product_id].count++;
        productSales[order.product_id].revenue += order.total_price || 0;
      });

      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({
          name: data.name,
          sales: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Order status breakdown
      const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;
      const cancelledOrders = orders?.filter(o => o.status === "cancelled").length || 0;
      const completionRate = orders && orders.length > 0 
        ? ((completedOrders.length / orders.length) * 100).toFixed(1) 
        : "0";

      // Review insights
      const avgRating = reviews && reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : vendor?.rating || "Belum ada rating";
      
      const recentReviews = reviews?.slice(0, 3).map(r => 
        `- ⭐${r.rating}: "${r.review_text?.substring(0, 50) || 'Tidak ada komentar'}..."`
      ).join('\n') || 'Belum ada review';

      // Peak hours analysis (simplified)
      const orderHours: Record<number, number> = {};
      recentOrders.forEach(o => {
        const hour = new Date(o.created_at).getHours();
        orderHours[hour] = (orderHours[hour] || 0) + 1;
      });
      const peakHour = Object.entries(orderHours)
        .sort((a, b) => b[1] - a[1])[0];
      const peakHourInfo = peakHour ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00` : "Belum cukup data";

      // Inactive products
      const activeProducts = products?.filter(p => p.is_available) || [];
      const inactiveProducts = products?.filter(p => !p.is_available) || [];
      const lowStockProducts = products?.filter(p => p.stock !== null && p.stock < 5) || [];

      vendorContext = `
DATA BISNIS VENDOR (${today.toLocaleDateString('id-ID')}):

🏪 PROFIL BISNIS:
- Nama: ${vendor?.business_name || "Unknown"}
- Status Verifikasi: ${vendor?.verification_status || "pending"}
- Kategori: ${vendor?.service_categories?.join(", ") || "Belum diset"}
- Rating: ${avgRating} ⭐
- Lokasi: ${vendor?.city || "Tidak diset"}

📦 PRODUK:
- Total Produk: ${products?.length || 0}
- Produk Aktif: ${activeProducts.length}
- Produk Non-aktif: ${inactiveProducts.length}
- Stok Rendah (<5): ${lowStockProducts.length}

🏆 TOP PRODUK:
${topProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.sales} terjual, Rp${p.revenue.toLocaleString()}`).join('\n') || 'Belum ada penjualan'}

📊 PERFORMA 30 HARI TERAKHIR:
- Pesanan Masuk: ${recentOrders.length}
- Pesanan Selesai: ${recentCompleted.length}
- Pending: ${pendingOrders}
- Dibatalkan: ${cancelledOrders}
- Completion Rate: ${completionRate}%
- Revenue: Rp${recentRevenue.toLocaleString()}
- Rata-rata Nilai Order: Rp${Math.round(avgOrderValue).toLocaleString()}

⏰ JAM SIBUK: ${peakHourInfo}

💬 REVIEW TERBARU:
${recentReviews}

📈 TOTAL (ALL TIME):
- Total Pesanan: ${orders?.length || 0}
- Total Revenue: Rp${totalRevenue.toLocaleString()}

🔧 PELUANG MAINTENANCE:
${(maintenanceOpportunities || []).map((m, i) => `${i + 1}. ${m.title} (${m.category}, ${m.priority})`).join('\n') || 'Tidak ada peluang saat ini'}

🏠 PROPERTI ASSIGNED:
${(assignedServices || []).map((s, i) => `${i + 1}. ${(s.property as any)?.name || 'N/A'} - ${s.service_type} (Rp${(s.monthly_fee || 0).toLocaleString()}/bulan)`).join('\n') || 'Belum ada'}
`;
    }

    const systemPrompt = `Kamu adalah AI business advisor untuk vendor di platform SiHuni, marketplace layanan properti di Indonesia. Tugasmu memberikan saran bisnis yang actionable.

${vendorContext}

PANDUAN:
1. Berikan saran spesifik berdasarkan data aktual vendor
2. Jawab dalam Bahasa Indonesia yang ramah dan profesional
3. Gunakan format currency Rp dengan pemisah ribuan
4. Identifikasi peluang improvement dari data
5. Berikan tips praktis yang bisa langsung dilakukan
6. Sertakan action button dengan format [Label](path):
   - Kelola produk: [Buka Produk](/vendor/products)
   - Buat promo: [Buat Promo](/vendor/products)
   - Lihat analytics: [Lihat Analytics](/vendor/earnings)
   - Cek pesanan: [Lihat Pesanan](/vendor/orders)

INSIGHT YANG BISA DIBERIKAN:
- Optimasi harga berdasarkan performa
- Rekomendasi produk baru berdasarkan kategori
- Tips meningkatkan rating dari review
- Strategi meningkatkan completion rate
- Analisis tren penjualan
- Saran pemanfaatan jam sibuk

Jawab dengan ringkas tapi informatif. Fokus pada actionable insights.`;

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
