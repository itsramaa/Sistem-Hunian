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
  aggregatePaymentHistory,
  aggregateOccupancyData,
  aggregateMaintenanceData,
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

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "dss-investment-insight", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const [paymentHistory, occupancy, maintenance] = await Promise.all([
      aggregatePaymentHistory(serviceClient, merchantId, 12),
      aggregateOccupancyData(serviceClient, merchantId, property_id),
      aggregateMaintenanceData(serviceClient, merchantId),
    ]);

    // Get property details
    const { data: property } = await serviceClient
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .single();

    // Expenses
    const { data: expenses } = await serviceClient
      .from("maintenance_expenses")
      .select("total_amount, created_at, maintenance_request_id")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Phase 6: Disaster risk & insurance data
    const [riskRes, insuranceRes, complianceRes] = await Promise.all([
      serviceClient.from("disaster_risk_profiles").select("*").eq("property_id", property_id).eq("merchant_id", merchantId).maybeSingle(),
      serviceClient.from("insurance_policies").select("*").eq("property_id", property_id).eq("merchant_id", merchantId).eq("status", "active"),
      serviceClient.from("compliance_documents").select("document_type, status, expiry_date").eq("property_id", property_id).eq("merchant_id", merchantId),
    ]);

    const expiredDocs = (complianceRes.data || []).filter(d => d.expiry_date && new Date(d.expiry_date) < new Date());

    const context = JSON.stringify({
      property,
      paymentHistory,
      occupancy,
      maintenance,
      expenses: expenses || [],
      disasterRiskProfile: riskRes.data || null,
      activeInsurance: insuranceRes.data || [],
      complianceStatus: { total: complianceRes.data?.length || 0, expired: expiredDocs.length },
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are an investment analysis advisor AI for Indonesian property management. Analyze P&L per property, occupancy trends, and maintenance costs to provide ROI analysis and improvement suggestions with payback periods. Currency is IDR.`,
      userContent: [{ type: "text", text: `Provide investment insights:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "investment_insight",
            description: "Return investment analysis and suggestions",
            parameters: {
              type: "object",
              properties: {
                roi_analysis: {
                  type: "object",
                  properties: {
                    annual_revenue: { type: "number" },
                    annual_expenses: { type: "number" },
                    net_income: { type: "number" },
                    roi_percentage: { type: "number" },
                    cap_rate: { type: "number" },
                  },
                  required: ["annual_revenue", "annual_expenses", "net_income", "roi_percentage"],
                },
                improvement_suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      suggestion: { type: "string" },
                      estimated_cost: { type: "number" },
                      expected_revenue_increase: { type: "number" },
                      payback_period_months: { type: "number" },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                    },
                    required: ["suggestion", "estimated_cost", "expected_revenue_increase", "payback_period_months", "priority"],
                  },
                },
                summary: { type: "string" },
                confidence: { type: "number" },
                outlook: { type: "string", enum: ["positive", "neutral", "negative"] },
              },
              required: ["roi_analysis", "improvement_suggestions", "summary", "confidence", "outlook"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "investment_insight" } },
    });

    const executionTimeMs = Date.now() - startTime;
    const insight = aiResult.toolCallResult as any;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "dss-investment-insight",
      merchantId,
      userId: auth.userId,
      inputSummary: `Property: ${property_id}`,
      outputSummary: insight.summary,
      confidenceScore: insight.confidence,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const recId = await createDssRecommendation(serviceClient, {
      merchantId,
      type: "investment",
      title: `Investment Insight: ${insight.outlook} outlook`,
      description: insight.summary,
      recommendationData: insight,
      confidenceScore: insight.confidence,
      impactEstimate: insight.roi_analysis,
      mlModelRunId: modelRunId,
    });

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      recommendation_id: recId,
      insight,
      execution_time_ms: executionTimeMs,
    });
  } catch (e) {
    console.error("dss-investment-insight error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
