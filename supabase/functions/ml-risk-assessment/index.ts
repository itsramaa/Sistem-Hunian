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
    if (!property_id) return errorResponse("property_id is required", 400);

    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ml-risk-assessment", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    // Fetch property
    const { data: property } = await serviceClient
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .eq("merchant_id", merchantId)
      .single();
    if (!property) return errorResponse("Property not found", 404);

    // Fetch all related data in parallel
    const [
      { data: riskProfiles },
      { data: insurancePolicies },
      { data: complianceDocs },
      { data: securityIncidents },
      { data: maintenanceRequests },
      { data: maintenanceExpenses },
      { data: units },
    ] = await Promise.all([
      serviceClient
        .from("disaster_risk_profiles")
        .select("*")
        .eq("property_id", property_id)
        .eq("merchant_id", merchantId),
      serviceClient
        .from("insurance_policies")
        .select("*")
        .eq("property_id", property_id)
        .eq("merchant_id", merchantId),
      serviceClient
        .from("compliance_documents")
        .select("*")
        .eq("property_id", property_id)
        .eq("merchant_id", merchantId),
      serviceClient
        .from("security_incidents")
        .select("*")
        .eq("property_id", property_id)
        .eq("merchant_id", merchantId)
        .order("incident_date", { ascending: false })
        .limit(50),
      serviceClient
        .from("maintenance_requests")
        .select("id, title, category, priority, status, created_at, resolved_at")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(100),
      serviceClient
        .from("maintenance_expenses")
        .select("id, total_amount, created_at")
        .eq("merchant_id", merchantId)
        .limit(200),
      serviceClient
        .from("units")
        .select("id, unit_number, unit_type, rent_price, status")
        .eq("property_id", property_id),
    ]);

    const context = JSON.stringify({
      property,
      disasterRiskProfiles: riskProfiles || [],
      insurancePolicies: insurancePolicies || [],
      complianceDocuments: complianceDocs || [],
      securityIncidents: securityIncidents || [],
      maintenanceRequests: maintenanceRequests || [],
      maintenanceExpenses: maintenanceExpenses || [],
      units: units || [],
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are a risk assessment AI for a property management (kosan/boarding house) platform in Indonesia.
Analyze property data including disaster risk profiles, insurance policies, security incidents, maintenance history, and compliance to provide:
1. Disaster risk score with detailed factor breakdown (earthquake, flood, fire, landslide, structural)
2. Preventive maintenance strategies prioritized by risk reduction impact
3. Potential loss estimation for various disaster scenarios
4. Insurance recommendations identifying coverage gaps
Currency is IDR. Consider Indonesian geography and climate patterns. Be practical and actionable.`,
      userContent: [{ type: "text", text: `Perform risk assessment:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "risk_assessment",
            description: "Return comprehensive risk assessment with scores, maintenance strategies, loss estimates, and insurance recommendations",
            parameters: {
              type: "object",
              properties: {
                disaster_risk_score: {
                  type: "object",
                  properties: {
                    overall_score: { type: "number", description: "0-100" },
                    risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    factors: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          factor: { type: "string" },
                          score: { type: "number", description: "0-100" },
                          description: { type: "string" },
                          weight: { type: "number", description: "0-1" },
                        },
                        required: ["factor", "score", "description", "weight"],
                      },
                    },
                  },
                  required: ["overall_score", "risk_level", "factors"],
                },
                preventive_maintenance: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      strategy: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      estimated_cost: { type: "number" },
                      frequency: { type: "string" },
                      risk_reduction_percentage: { type: "number" },
                      description: { type: "string" },
                    },
                    required: ["strategy", "priority", "estimated_cost", "frequency", "risk_reduction_percentage", "description"],
                  },
                },
                potential_loss_estimate: {
                  type: "object",
                  properties: {
                    scenarios: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          disaster_type: { type: "string" },
                          probability: { type: "number", description: "0-1" },
                          estimated_damage_cost: { type: "number" },
                          estimated_revenue_loss_months: { type: "number" },
                          total_potential_loss: { type: "number" },
                        },
                        required: ["disaster_type", "probability", "estimated_damage_cost", "estimated_revenue_loss_months", "total_potential_loss"],
                      },
                    },
                    annual_expected_loss: { type: "number" },
                    worst_case_loss: { type: "number" },
                  },
                  required: ["scenarios", "annual_expected_loss", "worst_case_loss"],
                },
                insurance_recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      coverage_type: { type: "string" },
                      recommended_coverage_amount: { type: "number" },
                      estimated_premium: { type: "number" },
                      reason: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      gap_identified: { type: "boolean" },
                    },
                    required: ["coverage_type", "recommended_coverage_amount", "estimated_premium", "reason", "priority", "gap_identified"],
                  },
                },
                summary: { type: "string" },
                confidence: { type: "number", description: "0-1" },
              },
              required: ["disaster_risk_score", "preventive_maintenance", "potential_loss_estimate", "insurance_recommendations", "summary", "confidence"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "risk_assessment" } },
    });

    const executionTimeMs = Date.now() - startTime;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "ml-risk-assessment",
      merchantId,
      userId: auth.userId,
      inputSummary: `Risk assessment for property ${property_id}`,
      outputSummary: aiResult.toolCallResult.summary as string,
      confidenceScore: aiResult.toolCallResult.confidence as number,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      assessment: aiResult.toolCallResult,
      execution_time_ms: executionTimeMs,
      tier: tierCheck.tierName,
    });
  } catch (e) {
    console.error("ml-risk-assessment error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
