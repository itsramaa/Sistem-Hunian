import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Sihuni AI Assistant, a helpful chatbot for a property management platform in Indonesia. You help tenants, merchants (property owners), and vendors with their questions.

Your capabilities:
1. Answer FAQs about payments, maintenance, contracts, and general platform usage
2. Recommend vendors based on service categories (plumbing, electrical, cleaning, etc.)
3. Provide guidance on using the platform features
4. Help users navigate to the right section of the app

Guidelines:
- Be friendly, professional, and helpful
- Use both Indonesian and English as needed based on the user's language
- Keep responses concise but informative
- If you don't know something specific about a user's account, guide them to the appropriate section
- For vendor recommendations, mention that they can browse the Marketplace for verified vendors
- For payment issues, direct them to the Payments section
- For maintenance requests, guide them to submit a maintenance request

Context about the platform:
- Tenants can: pay rent, submit maintenance requests, view contracts, browse vendor marketplace, participate in community forum
- Merchants can: manage properties/units, handle tenant payments, track maintenance, manage invoices
- Vendors can: list products/services, receive job requests, track earnings`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, conversationId, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client for knowledge base lookup
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get relevant FAQ knowledge based on latest user message
    const latestMessage = messages[messages.length - 1]?.content || "";
    let knowledgeContext = "";
    
    if (latestMessage) {
      const keywords = latestMessage.toLowerCase().split(/\s+/);
      const { data: knowledge } = await supabase
        .from("chatbot_knowledge")
        .select("question, answer")
        .eq("is_active", true);

      if (knowledge) {
        const relevantFaqs = knowledge.filter((k: any) => {
          const qLower = k.question.toLowerCase();
          const aLower = k.answer.toLowerCase();
          return keywords.some((kw: string) => 
            kw.length > 3 && (qLower.includes(kw) || aLower.includes(kw))
          );
        }).slice(0, 3);

        if (relevantFaqs.length > 0) {
          knowledgeContext = "\n\nRelevant FAQ information:\n" + 
            relevantFaqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
        }
      }
    }

    // Get vendor recommendations if user is asking about services
    const serviceKeywords = ["vendor", "tukang", "jasa", "plumber", "electrician", "cleaning", "service", "repair", "perbaikan"];
    const isAskingForVendor = serviceKeywords.some(kw => latestMessage.toLowerCase().includes(kw));
    
    let vendorContext = "";
    if (isAskingForVendor) {
      const { data: vendors } = await supabase
        .from("vendors")
        .select("business_name, service_categories, rating, city")
        .eq("verification_status", "verified")
        .limit(5);

      if (vendors && vendors.length > 0) {
        vendorContext = "\n\nAvailable verified vendors:\n" + 
          vendors.map((v: any) => 
            `- ${v.business_name} (${v.service_categories?.join(", ") || "General"}) - Rating: ${v.rating || "New"} - ${v.city || "Various locations"}`
          ).join("\n");
      }
    }

    // Add context to system prompt
    const enhancedSystemPrompt = SYSTEM_PROMPT + knowledgeContext + vendorContext + 
      (context ? `\n\nUser context: ${JSON.stringify(context)}` : "");

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
          { role: "system", content: enhancedSystemPrompt },
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
