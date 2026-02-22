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

// ─── DSS Recommendation Creation ──────────────────────────────────────────

export async function createDssRecommendation(
  serviceClient: SupabaseClient,
  params: {
    merchantId: string;
    type: string;
    title: string;
    description: string;
    recommendationData: Record<string, unknown>;
    confidenceScore?: number;
    impactEstimate?: Record<string, unknown>;
    mlModelRunId?: string;
    expiresAt?: string;
  }
): Promise<string> {
  const { data, error } = await serviceClient
    .from("dss_recommendations")
    .insert({
      merchant_id: params.merchantId,
      type: params.type,
      title: params.title,
      description: params.description,
      recommendation_data: params.recommendationData,
      confidence_score: params.confidenceScore,
      impact_estimate: params.impactEstimate,
      ml_model_run_id: params.mlModelRunId,
      expires_at: params.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create DSS recommendation:", error);
    throw error;
  }
  return data.id;
}

// ─── Upsert Risk Score ────────────────────────────────────────────────────

export async function upsertRiskScore(
  serviceClient: SupabaseClient,
  params: {
    tenantUserId: string;
    merchantId: string;
    riskScore: number;
    riskLevel: string;
    factors: Record<string, unknown>;
    mlModelRunId: string;
  }
): Promise<void> {
  const { error } = await serviceClient
    .from("tenant_risk_scores")
    .upsert(
      {
        tenant_user_id: params.tenantUserId,
        merchant_id: params.merchantId,
        risk_score: params.riskScore,
        risk_level: params.riskLevel,
        risk_factors: params.factors,
        ml_model_run_id: params.mlModelRunId,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_user_id,merchant_id" }
    );

  if (error) {
    console.error("Failed to upsert risk score:", error);
    throw error;
  }
}

// ─── Data Aggregation Helpers ─────────────────────────────────────────────

export async function aggregatePaymentHistory(
  serviceClient: SupabaseClient,
  merchantId: string,
  months = 12
): Promise<Record<string, unknown>> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data: invoices } = await serviceClient
    .from("invoices")
    .select("id, amount, total_amount, status, due_date, paid_at, late_fee, created_at")
    .eq("merchant_id", merchantId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  const all = invoices || [];
  const paid = all.filter((i) => i.status === "paid");
  const overdue = all.filter((i) => i.status === "overdue");
  const latePaid = paid.filter((i) => i.paid_at && i.due_date && new Date(i.paid_at) > new Date(i.due_date));

  return {
    totalInvoices: all.length,
    paidCount: paid.length,
    overdueCount: overdue.length,
    latePaidCount: latePaid.length,
    lateRatio: all.length > 0 ? latePaid.length / all.length : 0,
    totalRevenue: paid.reduce((s, i) => s + (i.total_amount || i.amount), 0),
    totalLateFees: all.reduce((s, i) => s + (i.late_fee || 0), 0),
    monthsCovered: months,
    invoices: all.slice(0, 50),
  };
}

export async function aggregateOccupancyData(
  serviceClient: SupabaseClient,
  merchantId: string,
  propertyId?: string
): Promise<Record<string, unknown>> {
  let query = serviceClient
    .from("units")
    .select("id, status, rent_price, property_id, properties(name)")
    .eq("properties.merchant_id", merchantId);

  if (propertyId) query = query.eq("property_id", propertyId);

  const { data: units } = await query;
  const all = units || [];
  const occupied = all.filter((u) => u.status === "occupied");
  const available = all.filter((u) => u.status === "available");

  const { data: contracts } = await serviceClient
    .from("contracts")
    .select("id, unit_id, start_date, end_date, rent_amount, status")
    .eq("merchant_id", merchantId)
    .in("status", ["active", "pending_signature"]);

  return {
    totalUnits: all.length,
    occupiedCount: occupied.length,
    availableCount: available.length,
    occupancyRate: all.length > 0 ? occupied.length / all.length : 0,
    avgRentPrice: all.length > 0 ? all.reduce((s, u) => s + (u.rent_price || 0), 0) / all.length : 0,
    activeContracts: (contracts || []).length,
    contracts: (contracts || []).slice(0, 50),
  };
}

export async function aggregateMaintenanceData(
  serviceClient: SupabaseClient,
  merchantId: string
): Promise<Record<string, unknown>> {
  const { data: requests } = await serviceClient
    .from("maintenance_requests")
    .select("id, status, priority, category, created_at, resolved_at, unit_id, tenant_user_id, assigned_vendor_id")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(100);

  const all = requests || [];
  const open = all.filter((r) => !["resolved", "closed"].includes(r.status));
  const resolved = all.filter((r) => r.status === "resolved");

  const avgResolutionMs =
    resolved.length > 0
      ? resolved.reduce((s, r) => {
          if (r.resolved_at && r.created_at) {
            return s + (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime());
          }
          return s;
        }, 0) / resolved.length
      : 0;

  return {
    totalRequests: all.length,
    openCount: open.length,
    resolvedCount: resolved.length,
    avgResolutionHours: Math.round(avgResolutionMs / (1000 * 60 * 60)),
    byPriority: {
      urgent: all.filter((r) => r.priority === "urgent").length,
      high: all.filter((r) => r.priority === "high").length,
      medium: all.filter((r) => r.priority === "medium").length,
      low: all.filter((r) => r.priority === "low").length,
    },
    openRequests: open.slice(0, 30),
  };
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
