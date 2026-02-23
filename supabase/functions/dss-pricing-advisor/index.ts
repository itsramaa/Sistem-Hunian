import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createServiceClient,
  createUserClient,
  authenticateUser,
  getMerchantId,
  checkTierLimit,
  callLovableAI,
  AiGatewayError,
  logModelRun,
  createDssRecommendation,
  aggregateOccupancyData,
  aggregatePaymentHistory,
  errorResponse,
  successResponse,
} from "../_shared/dss-utils.ts";

const TIER_LIMITS = { free: 0, starter: 0, professional: 0, enterprise: -1 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createUserClient(authHeader);
  const serviceClient = createServiceClient();

  try {
    const auth = await authenticateUser(req, userClient);
    if (auth.error) return auth.error;

    const { property_id, context: additionalContext } = await req.json();
    if (!property_id) return errorResponse("property_id is required", 400);

    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "dss-pricing-advisor", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    // Gather data
    const [occupancy, paymentHistory] = await Promise.all([
      aggregateOccupancyData(serviceClient, merchantId, property_id),
      aggregatePaymentHistory(serviceClient, merchantId, 12),
    ]);

    // Get latest pricing ML run if available
    const { data: latestPricing } = await serviceClient
      .from("ml_model_runs")
      .select("output_summary, metadata, created_at")
      .eq("merchant_id", merchantId)
      .eq("function_name", "ml-optimal-pricing")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Phase 6: Fetch property financial data
    const { data: propertyFinancials } = await serviceClient
      .from("properties")
      .select("name, construction_cost, renovation_cost, monthly_amortization, total_units, occupied_units")
      .eq("id", property_id)
      .single();

    // Phase 6: Fetch tenant payment metrics
    const { data: tenantMetrics } = await serviceClient
      .from("tenant_payment_metrics")
      .select("tenant_user_id, payment_score, avg_days_late, total_paid, total_unpaid")
      .eq("merchant_id", merchantId)
      .limit(50);

    // Phase 6: Fetch occupancy snapshots for seasonal data
    const { data: occupancySnapshots } = await serviceClient
      .from("occupancy_snapshots")
      .select("month, occupancy_rate, move_ins, move_outs")
      .eq("merchant_id", merchantId)
      .order("month", { ascending: false })
      .limit(12);

    const dataContext = JSON.stringify({
      occupancy,
      paymentHistory,
      latestPricingAnalysis: latestPricing,
      propertyFinancials: propertyFinancials || null,
      tenantPaymentMetrics: tenantMetrics || [],
      seasonalOccupancy: occupancySnapshots || [],
      additionalContext,
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are a strategic pricing advisor AI for Indonesian property management. Combine ML pricing data, occupancy trends, and market context to provide actionable pricing strategies with expected revenue impact. Currency is IDR.`,
      userContent: [{ type: "text", text: `Provide strategic pricing advice:\n${dataContext}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "pricing_advice",
            description: "Return strategic pricing recommendations",
            parameters: {
              type: "object",
              properties: {
                strategy: { type: "string" },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      target: { type: "string" },
                      expected_revenue_impact: { type: "number" },
                      timeline: { type: "string" },
                      risk_level: { type: "string", enum: ["low", "medium", "high"] },
                      rationale: { type: "string" },
                    },
                    required: ["action", "target", "expected_revenue_impact", "rationale"],
                  },
                },
                summary: { type: "string" },
                confidence: { type: "number" },
              },
              required: ["strategy", "recommendations", "summary", "confidence"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "pricing_advice" } },
    });

    const executionTimeMs = Date.now() - startTime;
    const advice = aiResult.toolCallResult as any;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "dss-pricing-advisor",
      merchantId,
      userId: auth.userId,
      inputSummary: `Property: ${property_id}`,
      outputSummary: advice.summary,
      confidenceScore: advice.confidence,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const recId = await createDssRecommendation(serviceClient, {
      merchantId,
      type: "pricing",
      title: `Pricing Strategy: ${advice.strategy}`,
      description: advice.summary,
      recommendationData: advice,
      confidenceScore: advice.confidence,
      impactEstimate: { recommendations: advice.recommendations },
      mlModelRunId: modelRunId,
    });

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      recommendation_id: recId,
      advice,
      execution_time_ms: executionTimeMs,
    });
  } catch (e) {
    console.error("dss-pricing-advisor error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
