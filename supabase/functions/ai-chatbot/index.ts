import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Error codes for client handling
const ERROR_CODES = {
  RATE_LIMIT: 'ERR_RATE_LIMIT',
  AI_UNAVAILABLE: 'ERR_AI_UNAVAILABLE',
  INVALID_INPUT: 'ERR_INVALID_INPUT',
  AUTH_REQUIRED: 'ERR_AUTH_REQUIRED',
  CONTEXT_FAILED: 'ERR_CONTEXT_FAILED',
};

// Input sanitization for prompt injection prevention
const sanitizeInput = (input: string): string => {
  const patterns = [
    /ignore previous instructions/gi,
    /system:/gi,
    /\[INST\]/gi,
    /<\|.*?\|>/g,
    /```system/gi,
    /\bprompt\s*:/gi,
  ];
  
  let sanitized = input;
  patterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim().slice(0, 1000); // Max length
};

// Validate message role
const isValidRole = (role: string): boolean => {
  return role === 'user' || role === 'assistant';
};

interface Knowledge {
  question: string;
  answer: string;
  category: string;
}

interface Vendor {
  business_name: string;
  service_categories: string[];
  rating: number;
  city: string;
  description: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, conversationId, context } = await req.json();
    
    // Validate input
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format");
      return new Response(JSON.stringify({ 
        error: { code: ERROR_CODES.INVALID_INPUT, message: "Format pesan tidak valid" }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Validate each message
    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== 'string') {
        return new Response(JSON.stringify({ 
          error: { code: ERROR_CODES.INVALID_INPUT, message: "Konten pesan tidak valid" }
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!isValidRole(msg.role)) {
        return new Response(JSON.stringify({ 
          error: { code: ERROR_CODES.INVALID_INPUT, message: "Role pesan tidak valid" }
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ 
        error: { code: ERROR_CODES.AI_UNAVAILABLE, message: "Layanan AI tidak tersedia" }
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sanitize and validate latest message
    const rawLatestMessage = messages[messages.length - 1]?.content || "";
    const latestMessage = sanitizeInput(rawLatestMessage);
    
    // Validate user role against allowed values
    const allowedRoles = ['tenant', 'merchant', 'vendor', 'admin'];
    const userRole = allowedRoles.includes(context?.role) ? context.role : "tenant";
    const userName = context?.userName?.slice(0, 100) || ""; // Limit name length

    console.log(`AI Chatbot: Processing for role=${userRole}, message: ${latestMessage.substring(0, 50)}...`);

    // Build role-specific context
    let userContext = "";
    let knowledgeContext = "";

    // Fetch FAQ knowledge base
    const keywords = latestMessage.toLowerCase().split(/\s+/);
    const { data: knowledge } = await supabase
      .from("chatbot_knowledge")
      .select("question, answer, category")
      .eq("is_active", true);

    if (knowledge) {
      const relevantFaqs = knowledge.filter((k: Knowledge) => {
        const qLower = k.question.toLowerCase();
        const aLower = k.answer.toLowerCase();
        return keywords.some((kw: string) => 
          kw.length > 3 && (qLower.includes(kw) || aLower.includes(kw))
        );
      }).slice(0, 3);

      if (relevantFaqs.length > 0) {
        knowledgeContext = "\n\nFAQ Terkait:\n" + 
          relevantFaqs.map((f: Knowledge) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
      }
    }

    // Build tenant-specific context
    if (userRole === "tenant" && userId) {
      // Get tenant's active contract and invoices
      const { data: contracts } = await supabase
        .from("contracts")
        .select(`
          id, rent_amount, start_date, end_date, status,
          unit:units(unit_number, property:properties(name, address))
        `)
        .eq("tenant_user_id", userId)
        .eq("status", "active")
        .limit(1);

      const activeContract = contracts?.[0];

      // Get unpaid invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, amount, due_date, status, invoice_number")
        .eq("tenant_user_id", userId)
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true })
        .limit(5);

      // Get tenant profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", userId)
        .single();

      // Get recent maintenance requests
      const { data: maintenance } = await supabase
        .from("maintenance_requests")
        .select("id, title, status, created_at")
        .eq("tenant_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);

      // Phase 6: Get property security & compliance info
      const contractUnit = activeContract?.unit as { unit_number: string; property: { name: string; address: string } } | null;
      let securityContext = "";
      let insuranceContext = "";

      if (activeContract) {
        // Find property_id from unit
        const { data: unitData } = await supabase
          .from("contracts")
          .select("unit:units(property_id)")
          .eq("id", activeContract.id)
          .single();

        const propertyId = (unitData?.unit as any)?.property_id;

        if (propertyId) {
          const [secIncidents, insPolicies] = await Promise.all([
            supabase.from("security_incidents").select("incident_type, severity, status, created_at").eq("property_id", propertyId).eq("status", "open").limit(5),
            supabase.from("insurance_policies").select("provider, policy_type, coverage_amount, status").eq("property_id", propertyId).eq("status", "active"),
          ]);

          if (secIncidents.data && secIncidents.data.length > 0) {
            securityContext = `\n\n⚠️ INSIDEN KEAMANAN TERBUKA:\n${secIncidents.data.map(i => `- ${i.incident_type} (${i.severity})`).join('\n')}`;
          }

          if (insPolicies.data && insPolicies.data.length > 0) {
            insuranceContext = `\n\n🛡️ ASURANSI PROPERTI:\n${insPolicies.data.map(p => `- ${p.provider}: ${p.policy_type} (Rp${p.coverage_amount.toLocaleString('id-ID')})`).join('\n')}`;
          }
        }
      }

      const unit = contractUnit;
      const unpaidTotal = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

      userContext = `
DATA TENANT SAAT INI:
- Nama: ${profile?.full_name || userName || "Tidak diketahui"}
- Properti: ${unit?.property?.name || "Tidak ada kontrak aktif"}
- Unit: ${unit?.unit_number || "-"}
- Alamat: ${unit?.property?.address || "-"}
- Sewa bulanan: Rp${activeContract?.rent_amount?.toLocaleString("id-ID") || 0}
- Kontrak berakhir: ${activeContract?.end_date || "-"}

TAGIHAN BELUM DIBAYAR (${invoices?.length || 0}):
${invoices?.map(inv => `- ${inv.invoice_number}: Rp${Number(inv.amount).toLocaleString("id-ID")} (${inv.status === "overdue" ? "TERLAMBAT" : "Jatuh tempo"}: ${inv.due_date})`).join("\n") || "Tidak ada tagihan"}
Total belum dibayar: Rp${unpaidTotal.toLocaleString("id-ID")}

REQUEST MAINTENANCE TERBARU:
${maintenance?.map(m => `- ${m.title} (${m.status})`).join("\n") || "Tidak ada"}
${securityContext}${insuranceContext}
`;
    }

    // Check for vendor recommendations
    const serviceKeywords = ["vendor", "tukang", "jasa", "plumber", "electrician", "cleaning", "service", "repair", "perbaikan", "laundry", "cuci", "kebersihan", "listrik", "ac"];
    const isAskingForVendor = serviceKeywords.some(kw => latestMessage.toLowerCase().includes(kw));
    
    let vendorContext = "";
    if (isAskingForVendor) {
      // Detect category from message
      let category = null;
      if (latestMessage.toLowerCase().includes("laundry") || latestMessage.toLowerCase().includes("cuci")) {
        category = "Laundry";
      } else if (latestMessage.toLowerCase().includes("listrik") || latestMessage.toLowerCase().includes("electrical")) {
        category = "Electrical";
      } else if (latestMessage.toLowerCase().includes("plumb") || latestMessage.toLowerCase().includes("pipa")) {
        category = "Plumbing";
      } else if (latestMessage.toLowerCase().includes("clean") || latestMessage.toLowerCase().includes("bersih")) {
        category = "Cleaning";
      } else if (latestMessage.toLowerCase().includes("ac")) {
        category = "AC";
      }

      const vendorQuery = supabase
        .from("vendors")
        .select("business_name, service_categories, rating, city, description")
        .eq("verification_status", "verified")
        .order("rating", { ascending: false })
        .limit(5);

      const { data: vendors } = await vendorQuery;

      if (vendors && vendors.length > 0) {
        vendorContext = "\n\nVENDOR TERSEDIA:\n" + 
          vendors.map((v: Vendor, idx: number) => 
            `${idx + 1}. ${v.business_name}
   - Kategori: ${v.service_categories?.join(", ") || "Umum"}
   - Rating: ${v.rating ? `⭐ ${v.rating}` : "Baru"}
   - Lokasi: ${v.city || "Berbagai lokasi"}
   - ${v.description?.substring(0, 100) || ""}`
          ).join("\n\n");
      }
    }

    // Build system prompt based on role
    const SYSTEM_PROMPT = `Kamu adalah Sihuni AI Assistant, asisten chatbot untuk platform manajemen properti di Indonesia. Kamu membantu tenant, merchant (pemilik properti), dan vendor dengan pertanyaan mereka.

PERAN USER: ${userRole.toUpperCase()}
${userContext}
${knowledgeContext}
${vendorContext}

PANDUAN MENJAWAB:
1. Jawab dalam Bahasa Indonesia yang sopan dan ramah
2. Gunakan data aktual user untuk personalisasi jawaban
3. Untuk pertanyaan pembayaran, sebutkan jumlah tagihan aktual jika ada
4. Format angka dengan Rp dan pemisah ribuan (contoh: Rp1.500.000)
5. Jika user bertanya cara melakukan sesuatu, berikan langkah-langkah jelas
6. Sertakan action button dengan format [Label](path) jika relevan:
   - Pembayaran: [Bayar Sekarang](/tenant/invoices)
   - Maintenance: [Lapor Maintenance](/tenant/maintenance)
   - Kontrak: [Lihat Kontrak](/tenant/contracts)
   - Marketplace: [Lihat Vendor](/tenant/marketplace)
7. Jika tidak tahu, jangan mengarang, arahkan ke bagian yang tepat
8. Jaga jawaban tetap ringkas tapi informatif

CONTOH RESPONS DENGAN ACTION:
"Kamu punya 2 tagihan belum dibayar total Rp3.000.000.
Untuk bayar:
1. Buka halaman Tagihan
2. Pilih invoice yang mau dibayar
3. Pilih metode pembayaran

[Bayar Sekarang](/tenant/invoices)"`;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
