import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Supabase Clients ──────────────────────────────────────────────────────

export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

export function createUserClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// ─── Auth Helper ───────────────────────────────────────────────────────────

export async function authenticateUser(
  req: Request,
  userClient: SupabaseClient
): Promise<{ userId: string; error?: never } | { userId?: never; error: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims) {
    return {
      error: new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { userId: data.claims.sub as string };
}

// ─── Tier Checking ─────────────────────────────────────────────────────────

interface TierLimits {
  [tierName: string]: number; // -1 = unlimited
}

export async function checkTierLimit(
  serviceClient: SupabaseClient,
  merchantId: string,
  featureName: string,
  tierLimits: TierLimits
): Promise<{ allowed: boolean; tierName: string; currentUsage: number; limit: number; error?: Response }> {
  // Get merchant subscription tier
  const { data: subscription } = await serviceClient
    .from("merchant_subscriptions")
    .select("status, tier:subscription_tiers(name)")
    .eq("merchant_id", merchantId)
    .in("status", ["active", "trialing"])
    .single();

  const tierName = (subscription?.tier as any)?.name || "free";
  const limit = tierLimits[tierName] ?? 0;

  if (limit === 0) {
    return {
      allowed: false,
      tierName,
      currentUsage: 0,
      limit: 0,
      error: new Response(
        JSON.stringify({
          error: "Feature not available",
          message: `${featureName} is not available on the ${tierName} plan. Please upgrade.`,
          tier: tierName,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  if (limit === -1) {
    return { allowed: true, tierName, currentUsage: 0, limit: -1 };
  }

  // Count usage this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await serviceClient
    .from("ml_model_runs")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .eq("function_name", featureName)
    .gte("created_at", startOfMonth.toISOString());

  const currentUsage = count || 0;

  if (currentUsage >= limit) {
    return {
      allowed: false,
      tierName,
      currentUsage,
      limit,
      error: new Response(
        JSON.stringify({
          error: "Monthly limit reached",
          message: `You have used ${currentUsage}/${limit} ${featureName} this month. Upgrade for more.`,
          tier: tierName,
          currentUsage,
          limit,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  return { allowed: true, tierName, currentUsage, limit };
}

// ─── Get Merchant ID for User ──────────────────────────────────────────────

export async function getMerchantId(
  serviceClient: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await serviceClient
    .from("merchants")
    .select("id")
    .eq("user_id", userId)
    .single();
  return data?.id || null;
}

// ─── Storage Image Download → Base64 ───────────────────────────────────────

export async function downloadImageAsBase64(
  serviceClient: SupabaseClient,
  bucket: string,
  path: string
): Promise<{ base64: string; mimeType: string }> {
  const { data, error } = await serviceClient.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(`Failed to download image: ${error?.message || "Unknown error"}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);

  const mimeType = data.type || "image/jpeg";
  return { base64, mimeType };
}

// ─── Lovable AI Gateway Call (with Tool Calling) ───────────────────────────

interface AiToolCallResult {
  toolCallResult: Record<string, unknown>;
  rawResponse: Record<string, unknown>;
  tokensUsed?: number;
}

export async function callLovableAI(options: {
  systemPrompt: string;
  userContent: Array<{ type: string; text?: string; image_url?: { url: string } }>;
  tools: Array<Record<string, unknown>>;
  toolChoice: Record<string, unknown>;
  model?: string;
}): Promise<AiToolCallResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model || "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userContent },
      ],
      tools: options.tools,
      tool_choice: options.toolChoice,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI Gateway error:", response.status, errText);

    if (response.status === 429) {
      throw new AiGatewayError("Rate limit exceeded. Please try again later.", 429);
    }
    if (response.status === 402) {
      throw new AiGatewayError("AI service payment required. Please add credits.", 402);
    }
    throw new AiGatewayError(`AI Gateway error: ${response.status}`, 500);
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall) {
    throw new Error("AI did not return a tool call response");
  }

  const toolCallResult = JSON.parse(toolCall.function.arguments);
  const tokensUsed = result.usage?.total_tokens;

  return { toolCallResult, rawResponse: result, tokensUsed };
}

export class AiGatewayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ─── ML Model Run Logging ──────────────────────────────────────────────────

export async function logModelRun(
  serviceClient: SupabaseClient,
  params: {
    functionName: string;
    modelName?: string;
    merchantId: string | null;
    userId: string;
    inputSummary?: string;
    outputSummary?: string;
    confidenceScore?: number;
    executionTimeMs?: number;
    tokensUsed?: number;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  const { data, error } = await serviceClient
    .from("ml_model_runs")
    .insert({
      function_name: params.functionName,
      model_name: params.modelName || "google/gemini-2.5-pro",
      merchant_id: params.merchantId,
      user_id: params.userId,
      input_summary: params.inputSummary,
      output_summary: params.outputSummary,
      confidence_score: params.confidenceScore,
      execution_time_ms: params.executionTimeMs,
      tokens_used: params.tokensUsed,
      error_message: params.errorMessage,
      metadata: params.metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log model run:", error);
    throw error;
  }

  return data.id;
}

// ─── OCR Result Creation ───────────────────────────────────────────────────

export async function createOcrResult(
  serviceClient: SupabaseClient,
  params: {
    userId: string;
    merchantId: string | null;
    documentType: string;
    documentUrl: string;
    status: string;
    extractedData: Record<string, unknown>;
    confidenceScore: number;
    requiresReview: boolean;
    mlModelRunId: string;
    processingTimeMs: number;
    errorMessage?: string;
  }
): Promise<string> {
  const { data, error } = await serviceClient
    .from("ocr_results")
    .insert({
      user_id: params.userId,
      merchant_id: params.merchantId,
      document_type: params.documentType,
      document_url: params.documentUrl,
      status: params.status,
      extracted_data: params.extractedData,
      confidence_score: params.confidenceScore,
      requires_review: params.requiresReview,
      ml_model_run_id: params.mlModelRunId,
      processing_time_ms: params.processingTimeMs,
      error_message: params.errorMessage,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create OCR result:", error);
    throw error;
  }

  return data.id;
}

// ─── Error Response Helper ─────────────────────────────────────────────────

export function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function successResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
