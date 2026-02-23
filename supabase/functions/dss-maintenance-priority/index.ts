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
  aggregateMaintenanceData,
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

    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "dss-maintenance-priority", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const maintenanceData = await aggregateMaintenanceData(serviceClient, merchantId);

    // Get vendor info
    const { data: vendors } = await serviceClient
      .from("vendors")
      .select("id, business_name, service_categories, rating, verification_status")
      .eq("verification_status", "verified")
      .limit(20);

    // Get tenant satisfaction context (risk scores)
    const { data: riskScores } = await serviceClient
      .from("tenant_risk_scores")
      .select("tenant_user_id, risk_score, risk_level")
      .eq("merchant_id", merchantId);

    // Phase 6: Security incidents
    const { data: securityIncidents } = await serviceClient
      .from("security_incidents")
      .select("id, incident_type, severity, status, property_id, created_at")
      .eq("merchant_id", merchantId)
      .eq("status", "open")
      .limit(20);

    // Phase 6: Guardian assignments
    const { data: guardians } = await serviceClient
      .from("property_guardians")
      .select("id, property_id, status")
      .eq("merchant_id", merchantId)
      .eq("status", "active");

    const context = JSON.stringify({
      maintenance: maintenanceData,
      vendors: vendors || [],
      tenantRiskScores: riskScores || [],
      openSecurityIncidents: securityIncidents || [],
      activeGuardians: guardians || [],
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are a maintenance prioritization advisor AI for Indonesian property management. Analyze open maintenance requests, tenant satisfaction impact, unit revenue impact, and available vendors to create a prioritized queue.`,
      userContent: [{ type: "text", text: `Prioritize maintenance requests:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "prioritize_maintenance",
            description: "Return prioritized maintenance queue",
            parameters: {
              type: "object",
              properties: {
                prioritized_queue: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      request_id: { type: "string" },
                      priority_rank: { type: "number" },
                      urgency_score: { type: "number", description: "0-100" },
                      impact_analysis: { type: "string" },
                      suggested_vendor_id: { type: "string" },
                      estimated_resolution_hours: { type: "number" },
                      rationale: { type: "string" },
                    },
                    required: ["request_id", "priority_rank", "urgency_score", "impact_analysis", "rationale"],
                  },
                },
                summary: { type: "string" },
                confidence: { type: "number" },
                resource_allocation_advice: { type: "string" },
              },
              required: ["prioritized_queue", "summary", "confidence"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "prioritize_maintenance" } },
    });

    const executionTimeMs = Date.now() - startTime;
    const priority = aiResult.toolCallResult as any;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "dss-maintenance-priority",
      merchantId,
      userId: auth.userId,
      inputSummary: `${maintenanceData.openCount} open requests`,
      outputSummary: priority.summary,
      confidenceScore: priority.confidence,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const recId = await createDssRecommendation(serviceClient, {
      merchantId,
      type: "maintenance",
      title: `Maintenance Priority Queue (${maintenanceData.openCount} items)`,
      description: priority.summary,
      recommendationData: priority,
      confidenceScore: priority.confidence,
      mlModelRunId: modelRunId,
    });

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      recommendation_id: recId,
      priority,
      execution_time_ms: executionTimeMs,
    });
  } catch (e) {
    console.error("dss-maintenance-priority error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
