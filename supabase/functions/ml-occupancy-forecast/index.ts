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

    const { property_id, forecast_months = 6 } = await req.json();
    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ml-occupancy-forecast", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    // Get properties
    let propQuery = serviceClient
      .from("properties")
      .select("id, name, total_units, occupied_units")
      .eq("merchant_id", merchantId);
    if (property_id) propQuery = propQuery.eq("id", property_id);
    const { data: properties } = await propQuery;
    const propertyIds = (properties || []).map((p) => p.id);

    // Fetch occupancy snapshots (up to 24 months)
    const since24m = new Date();
    since24m.setMonth(since24m.getMonth() - 24);
    const { data: snapshots } = await serviceClient
      .from("occupancy_snapshots")
      .select("property_id, snapshot_date, total_units, occupied_units, occupancy_rate")
      .in("property_id", propertyIds)
      .gte("snapshot_date", since24m.toISOString().split("T")[0])
      .order("snapshot_date", { ascending: true })
      .limit(500);

    // Fetch contracts (historical patterns)
    const { data: contracts } = await serviceClient
      .from("contracts")
      .select("id, unit_id, start_date, end_date, actual_end_date, status, rent_amount")
      .eq("merchant_id", merchantId)
      .order("start_date", { ascending: false })
      .limit(300);

    // Fetch units
    const { data: units } = await serviceClient
      .from("units")
      .select("id, unit_type, status, rent_price, property_id")
      .in("property_id", propertyIds);

    // Fetch tenant payment metrics for churn correlation
    const { data: tenantMetrics } = await serviceClient
      .from("tenant_payment_metrics")
      .select("tenant_user_id, late_payment_count, total_payments, avg_days_to_pay, on_time_rate")
      .eq("merchant_id", merchantId)
      .limit(200);

    const context = JSON.stringify({
      properties: properties || [],
      occupancySnapshots: snapshots || [],
      contracts: contracts || [],
      units: units || [],
      tenantPaymentMetrics: tenantMetrics || [],
      forecastMonths: forecast_months,
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are an occupancy forecasting AI for a property management (kosan/boarding house) platform in Indonesia.
Analyze historical occupancy data, contract patterns, and tenant behavior to:
1. Predict monthly occupancy rates for the next ${forecast_months} months
2. Identify seasonal patterns (peak/low season)
3. Calculate turnover metrics
4. Generate warnings for declining occupancy trends
5. Detect anomalies - unusual occupancy patterns such as sudden spikes/drops, off-season anomalies, or statistically abnormal occupancy rates
Be specific with predictions and provide actionable insights.`,
      userContent: [{ type: "text", text: `Forecast occupancy based on this data:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "forecast_occupancy",
            description: "Return occupancy predictions, seasonal patterns, turnover metrics, and warnings",
            parameters: {
              type: "object",
              properties: {
                monthly_predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string", description: "YYYY-MM" },
                      predicted_occupancy_rate: { type: "number", description: "0-1" },
                      confidence: { type: "number", description: "0-1" },
                      predicted_move_ins: { type: "number" },
                      predicted_move_outs: { type: "number" },
                    },
                    required: ["month", "predicted_occupancy_rate", "confidence", "predicted_move_ins", "predicted_move_outs"],
                  },
                },
                seasonal_patterns: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      period: { type: "string" },
                      pattern_type: { type: "string", enum: ["peak", "low", "transition"] },
                      description: { type: "string" },
                      months_affected: { type: "array", items: { type: "number" } },
                    },
                    required: ["period", "pattern_type", "description", "months_affected"],
                  },
                },
                turnover_metrics: {
                  type: "object",
                  properties: {
                    current_turnover_rate: { type: "number", description: "0-1" },
                    predicted_turnover_rate: { type: "number", description: "0-1" },
                    avg_vacancy_days: { type: "number" },
                    trend: { type: "string", enum: ["improving", "stable", "worsening"] },
                  },
                  required: ["current_turnover_rate", "predicted_turnover_rate", "avg_vacancy_days", "trend"],
                },
                warnings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      message: { type: "string" },
                      recommended_action: { type: "string" },
                    },
                    required: ["type", "severity", "message", "recommended_action"],
                  },
                },
                anomalies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      period: { type: "string", description: "YYYY-MM or date range" },
                      anomaly_type: { type: "string", enum: ["spike", "drop", "off_season", "trend_break"] },
                      severity: { type: "string", enum: ["low", "medium", "high"] },
                      description: { type: "string" },
                      expected_value: { type: "number", description: "Expected occupancy rate 0-1" },
                      actual_value: { type: "number", description: "Actual/detected occupancy rate 0-1" },
                    },
                    required: ["period", "anomaly_type", "severity", "description"],
                  },
                },
                summary: { type: "string" },
              },
              required: ["monthly_predictions", "seasonal_patterns", "turnover_metrics", "warnings", "anomalies", "summary"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "forecast_occupancy" } },
    });

    const executionTimeMs = Date.now() - startTime;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "ml-occupancy-forecast",
      merchantId,
      userId: auth.userId,
      inputSummary: `${forecast_months} month forecast, property: ${property_id || "all"}, ${(snapshots || []).length} snapshots`,
      outputSummary: aiResult.toolCallResult.summary as string,
      confidenceScore: (aiResult.toolCallResult.monthly_predictions as any[])?.[0]?.confidence,
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
    console.error("ml-occupancy-forecast error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
