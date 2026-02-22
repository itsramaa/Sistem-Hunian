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
  aggregateOccupancyData,
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

    const { property_id } = await req.json();
    if (!property_id) return errorResponse("property_id is required", 400);

    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ml-optimal-pricing", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const occupancy = await aggregateOccupancyData(serviceClient, merchantId, property_id);

    // Get units with details
    const { data: units } = await serviceClient
      .from("units")
      .select("id, unit_number, status, rent_price, floor, amenities, unit_type, property_id")
      .eq("property_id", property_id);

    // Get property details
    const { data: property } = await serviceClient
      .from("properties")
      .select("id, name, address, city_id, type, total_units, occupied_units")
      .eq("id", property_id)
      .single();

    // Historical contracts for pricing trends
    const { data: pastContracts } = await serviceClient
      .from("contracts")
      .select("unit_id, rent_amount, start_date, end_date, status")
      .eq("merchant_id", merchantId)
      .order("start_date", { ascending: false })
      .limit(50);

    const context = JSON.stringify({
      property,
      units: units || [],
      occupancy,
      pastContracts: pastContracts || [],
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are a rental pricing optimization AI for Indonesian property management. Analyze unit amenities, occupancy, historical rents, and market context to suggest optimal pricing per unit. Currency is IDR.`,
      userContent: [{ type: "text", text: `Suggest optimal pricing for units:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_pricing",
            description: "Return optimal pricing suggestions per unit",
            parameters: {
              type: "object",
              properties: {
                unit_suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      unit_id: { type: "string" },
                      current_price: { type: "number" },
                      suggested_price: { type: "number" },
                      price_range_low: { type: "number" },
                      price_range_high: { type: "number" },
                      justification: { type: "string" },
                      expected_impact: { type: "string" },
                    },
                    required: ["unit_id", "current_price", "suggested_price", "price_range_low", "price_range_high", "justification"],
                  },
                },
                summary: { type: "string" },
                market_context: { type: "string" },
              },
              required: ["unit_suggestions", "summary", "market_context"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "suggest_pricing" } },
    });

    const executionTimeMs = Date.now() - startTime;
    const pricing = aiResult.toolCallResult as any;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "ml-optimal-pricing",
      merchantId,
      userId: auth.userId,
      inputSummary: `Property: ${property_id}, ${(units || []).length} units`,
      outputSummary: pricing.summary,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      pricing,
      execution_time_ms: executionTimeMs,
    });
  } catch (e) {
    console.error("ml-optimal-pricing error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
