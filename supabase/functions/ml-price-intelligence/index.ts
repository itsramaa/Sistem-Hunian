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

const TIER_LIMITS = { free: 0, starter: 0, professional: 3, enterprise: -1 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createUserClient(authHeader);
  const serviceClient = createServiceClient();

  try {
    const auth = await authenticateUser(req, userClient);
    if (auth.error) return auth.error;

    const { property_id } = await req.json();
    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ml-price-intelligence", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    // Fetch merchant's properties to get city info
    let propQuery = serviceClient
      .from("properties")
      .select("id, name, property_type, address, city, total_units, occupied_units")
      .eq("merchant_id", merchantId);
    if (property_id) propQuery = propQuery.eq("id", property_id);
    const { data: properties } = await propQuery;

    // Fetch all units for this merchant
    let unitQuery = serviceClient
      .from("units")
      .select("id, unit_number, unit_type, rent_price, status, amenities, property_id")
      .in("property_id", (properties || []).map((p) => p.id));
    const { data: units } = await unitQuery;

    // Fetch contracts from last 12 months for pricing history
    const since12m = new Date();
    since12m.setMonth(since12m.getMonth() - 12);
    const { data: contracts } = await serviceClient
      .from("contracts")
      .select("id, unit_id, rent_amount, start_date, end_date, status")
      .eq("merchant_id", merchantId)
      .gte("start_date", since12m.toISOString())
      .order("start_date", { ascending: false })
      .limit(200);

    // Fetch occupancy snapshots
    const { data: snapshots } = await serviceClient
      .from("occupancy_snapshots")
      .select("property_id, snapshot_date, total_units, occupied_units, occupancy_rate")
      .in("property_id", (properties || []).map((p) => p.id))
      .order("snapshot_date", { ascending: false })
      .limit(100);

    const context = JSON.stringify({
      properties: properties || [],
      units: units || [],
      contracts: contracts || [],
      occupancySnapshots: snapshots || [],
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are a price intelligence AI for a property management (kosan/boarding house) platform in Indonesia.
Analyze unit data, historical rental contracts, and occupancy to provide:
1. Price segmentation by unit type/location
2. Optimal pricing recommendations per unit
3. Monthly price trends over available history
4. Price outlier detection
Currency is IDR. Be specific with numbers and actionable recommendations.`,
      userContent: [{ type: "text", text: `Analyze pricing data:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "analyze_pricing",
            description: "Return comprehensive pricing analysis with segments, recommendations, trends, and outliers",
            parameters: {
              type: "object",
              properties: {
                segments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      segment_name: { type: "string" },
                      avg_price: { type: "number" },
                      unit_count: { type: "number" },
                      occupancy_rate: { type: "number", description: "0-1" },
                      price_range: {
                        type: "object",
                        properties: { min: { type: "number" }, max: { type: "number" } },
                        required: ["min", "max"],
                      },
                    },
                    required: ["segment_name", "avg_price", "unit_count", "occupancy_rate", "price_range"],
                  },
                },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      unit_id: { type: "string" },
                      unit_number: { type: "string" },
                      current_price: { type: "number" },
                      optimal_price: { type: "number" },
                      reason: { type: "string" },
                      confidence: { type: "number", description: "0-1" },
                    },
                    required: ["unit_id", "current_price", "optimal_price", "reason", "confidence"],
                  },
                },
                price_trends: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string", description: "YYYY-MM" },
                      avg_price: { type: "number" },
                      median_price: { type: "number" },
                      sample_count: { type: "number" },
                    },
                    required: ["month", "avg_price", "median_price", "sample_count"],
                  },
                },
                outliers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      unit_id: { type: "string" },
                      unit_number: { type: "string" },
                      current_price: { type: "number" },
                      expected_range: {
                        type: "object",
                        properties: { min: { type: "number" }, max: { type: "number" } },
                        required: ["min", "max"],
                      },
                      anomaly_type: { type: "string", enum: ["overpriced", "underpriced"] },
                      severity: { type: "string", enum: ["low", "medium", "high"] },
                    },
                    required: ["unit_id", "current_price", "expected_range", "anomaly_type", "severity"],
                  },
                },
                summary: { type: "string" },
                market_context: { type: "string" },
              },
              required: ["segments", "recommendations", "price_trends", "outliers", "summary", "market_context"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "analyze_pricing" } },
    });

    const executionTimeMs = Date.now() - startTime;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "ml-price-intelligence",
      merchantId,
      userId: auth.userId,
      inputSummary: `Price analysis, property: ${property_id || "all"}, ${(units || []).length} units`,
      outputSummary: aiResult.toolCallResult.summary as string,
      confidenceScore: (aiResult.toolCallResult.recommendations as any[])?.[0]?.confidence,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      analysis: aiResult.toolCallResult,
      execution_time_ms: executionTimeMs,
      tier: tierCheck.tierName,
    });
  } catch (e) {
    console.error("ml-price-intelligence error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
