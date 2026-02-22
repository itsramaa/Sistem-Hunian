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
  aggregatePaymentHistory,
  aggregateOccupancyData,
  errorResponse,
  successResponse,
} from "../_shared/dss-utils.ts";

const TIER_LIMITS = { free: 0, starter: 0, professional: 5, enterprise: -1 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createUserClient(authHeader);
  const serviceClient = createServiceClient();

  try {
    const auth = await authenticateUser(req, userClient);
    if (auth.error) return auth.error;

    const { forecast_months = 6, property_id } = await req.json();
    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ml-revenue-forecast", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const [paymentHistory, occupancy] = await Promise.all([
      aggregatePaymentHistory(serviceClient, merchantId, 12),
      aggregateOccupancyData(serviceClient, merchantId, property_id),
    ]);

    // Get contract renewals
    const { data: contracts } = await serviceClient
      .from("contracts")
      .select("id, unit_id, start_date, end_date, rent_amount, status")
      .eq("merchant_id", merchantId)
      .in("status", ["active"]);

    const context = JSON.stringify({
      paymentHistory,
      occupancy,
      activeContracts: contracts || [],
      forecastMonths: forecast_months,
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are a revenue forecasting AI for a property management platform in Indonesia. Analyze payment history, occupancy trends, and contract data to predict monthly revenue. Provide confidence intervals. Currency is IDR.`,
      userContent: [{ type: "text", text: `Forecast revenue for the next ${forecast_months} months based on this data:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "forecast_revenue",
            description: "Return monthly revenue predictions with confidence intervals",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string", description: "YYYY-MM format" },
                      predicted_revenue: { type: "number" },
                      lower_bound: { type: "number" },
                      upper_bound: { type: "number" },
                      confidence: { type: "number", description: "0-1" },
                    },
                    required: ["month", "predicted_revenue", "lower_bound", "upper_bound", "confidence"],
                  },
                },
                summary: { type: "string" },
                trend: { type: "string", enum: ["increasing", "stable", "decreasing"] },
                key_factors: { type: "array", items: { type: "string" } },
              },
              required: ["predictions", "summary", "trend", "key_factors"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "forecast_revenue" } },
    });

    const executionTimeMs = Date.now() - startTime;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "ml-revenue-forecast",
      merchantId,
      userId: auth.userId,
      inputSummary: `${forecast_months} month forecast, property: ${property_id || "all"}`,
      outputSummary: aiResult.toolCallResult.summary as string,
      confidenceScore: (aiResult.toolCallResult.predictions as any[])?.[0]?.confidence,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      forecast: aiResult.toolCallResult,
      execution_time_ms: executionTimeMs,
      tier: tierCheck.tierName,
    });
  } catch (e) {
    console.error("ml-revenue-forecast error:", e);
    const executionTimeMs = Date.now() - startTime;
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
