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

const TIER_LIMITS = { free: 0, starter: 3, professional: 15, enterprise: -1 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createUserClient(authHeader);
  const serviceClient = createServiceClient();

  try {
    const auth = await authenticateUser(req, userClient);
    if (auth.error) return auth.error;

    const { tenant_user_id, screening_data, batch } = await req.json();
    if (!tenant_user_id && !screening_data && !batch) {
      return errorResponse("tenant_user_id, screening_data, or batch=true is required", 400);
    }

    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ml-tenant-quality-scoring", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    // Batch mode: score all active tenants
    if (batch) {
      const { data: activeContracts } = await serviceClient
        .from("contracts")
        .select("tenant_user_id")
        .eq("merchant_id", merchantId)
        .eq("status", "active");

      const uniqueTenantIds = [...new Set((activeContracts || []).map((c) => c.tenant_user_id))];
      if (uniqueTenantIds.length === 0) return errorResponse("No active tenants found", 404);

      const results = [];
      for (const tId of uniqueTenantIds.slice(0, 50)) {
        try {
          const tenantData = await fetchTenantData(serviceClient, merchantId, tId);
          const aiResult = await runQualityScoring(tenantData, null);
          results.push({ tenant_user_id: tId, name: tenantData.profile?.full_name || "Unknown", ...aiResult.toolCallResult });
        } catch (e) {
          console.error(`Batch scoring error for ${tId}:`, e);
          results.push({ tenant_user_id: tId, error: (e as Error).message });
        }
      }

      const executionTimeMs = Date.now() - startTime;
      await logModelRun(serviceClient, {
        functionName: "ml-tenant-quality-scoring",
        merchantId,
        userId: auth.userId,
        inputSummary: `Batch quality scoring for ${uniqueTenantIds.length} tenants`,
        outputSummary: `Scored ${results.filter((r) => !r.error).length}/${uniqueTenantIds.length} tenants`,
        executionTimeMs,
      });

      return successResponse({ success: true, batch: true, results, execution_time_ms: executionTimeMs, tier: tierCheck.tierName });
    }

    // Single tenant or screening mode
    let tenantData: Record<string, unknown> | null = null;
    if (tenant_user_id) {
      tenantData = await fetchTenantData(serviceClient, merchantId, tenant_user_id);
    }

    const aiResult = await runQualityScoring(tenantData, screening_data || null);
    const executionTimeMs = Date.now() - startTime;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "ml-tenant-quality-scoring",
      merchantId,
      userId: auth.userId,
      inputSummary: tenant_user_id
        ? `Quality scoring for tenant ${tenant_user_id}`
        : `Screening for candidate: ${screening_data?.name || "unknown"}`,
      outputSummary: aiResult.toolCallResult.summary as string,
      confidenceScore: aiResult.toolCallResult.confidence as number,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      scoring: aiResult.toolCallResult,
      execution_time_ms: executionTimeMs,
      tier: tierCheck.tierName,
    });
  } catch (e) {
    console.error("ml-tenant-quality-scoring error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});

async function fetchTenantData(serviceClient: any, merchantId: string, tenantUserId: string) {
  const since24m = new Date();
  since24m.setMonth(since24m.getMonth() - 24);

  const [invoicesRes, contractsRes, collectionsRes, maintenanceRes, metricsRes, riskRes, profileRes] = await Promise.all([
    serviceClient.from("invoices").select("id, amount, total_amount, status, due_date, paid_at, late_fee").eq("merchant_id", merchantId).eq("tenant_user_id", tenantUserId).gte("due_date", since24m.toISOString().split("T")[0]).order("due_date", { ascending: false }).limit(200),
    serviceClient.from("contracts").select("id, unit_id, rent_amount, start_date, end_date, status, deposit_amount").eq("merchant_id", merchantId).eq("tenant_user_id", tenantUserId).order("start_date", { ascending: false }).limit(20),
    serviceClient.from("collections_cases").select("id, status, days_overdue, escalation_level, total_due, resolution_type, created_at").eq("merchant_id", merchantId).eq("tenant_user_id", tenantUserId).limit(50),
    serviceClient.from("maintenance_requests").select("id, status, priority, category, created_at, resolved_at").eq("merchant_id", merchantId).eq("tenant_user_id", tenantUserId).limit(50),
    serviceClient.from("tenant_payment_metrics").select("*").eq("merchant_id", merchantId).eq("tenant_user_id", tenantUserId).single(),
    serviceClient.from("tenant_risk_scores").select("*").eq("merchant_id", merchantId).eq("tenant_user_id", tenantUserId).single(),
    serviceClient.from("profiles").select("full_name, email, phone, created_at").eq("user_id", tenantUserId).single(),
  ]);

  return {
    profile: profileRes.data,
    invoices: invoicesRes.data || [],
    contracts: contractsRes.data || [],
    collections: collectionsRes.data || [],
    maintenance: maintenanceRes.data || [],
    paymentMetrics: metricsRes.data,
    existingRiskScore: riskRes.data,
  };
}

async function runQualityScoring(tenantData: Record<string, unknown> | null, screeningData: Record<string, unknown> | null) {
  const context = JSON.stringify({
    existingTenant: tenantData,
    screeningCandidate: screeningData,
    currentDate: new Date().toISOString(),
  });

  return await callLovableAI({
    systemPrompt: `You are a tenant quality assessment AI for a property management (kosan/boarding house) platform in Indonesia.
Evaluate tenant quality comprehensively:
1. Quality Score (0-100, higher = better) with grade A/B/C/D/F
2. Payment Reliability: score, on-time ratio, avg days late, trend, 6-month prediction
3. Risk Profile: level, specific flags with severity, churn probability
4. Screening Recommendation: approve/approve_with_conditions/review/reject with reasoning
5. Behavioral Insights: categorized observations about tenant behavior

For new tenant screening (no historical data), base assessment on provided screening data (employment, income, references) and provide conservative estimates.
Be thorough but fair. Currency is IDR.`,
    userContent: [{ type: "text", text: `Assess tenant quality:\n${context}` }],
    tools: [
      {
        type: "function",
        function: {
          name: "score_tenant_quality",
          description: "Return comprehensive tenant quality assessment",
          parameters: {
            type: "object",
            properties: {
              quality_score: { type: "number", description: "0-100, higher = better" },
              quality_grade: { type: "string", enum: ["A", "B", "C", "D", "F"] },
              payment_reliability: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  on_time_ratio: { type: "number" },
                  avg_days_late: { type: "number" },
                  trend: { type: "string", enum: ["improving", "stable", "declining"] },
                  prediction_next_6_months: { type: "string", enum: ["reliable", "moderate_risk", "high_risk"] },
                },
                required: ["score", "on_time_ratio", "avg_days_late", "trend", "prediction_next_6_months"],
              },
              risk_profile: {
                type: "object",
                properties: {
                  level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  flags: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        flag: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        description: { type: "string" },
                      },
                      required: ["flag", "severity", "description"],
                    },
                  },
                  churn_probability: { type: "number" },
                },
                required: ["level", "flags", "churn_probability"],
              },
              screening_recommendation: {
                type: "object",
                properties: {
                  decision: { type: "string", enum: ["approve", "approve_with_conditions", "review", "reject"] },
                  conditions: { type: "array", items: { type: "string" } },
                  reasoning: { type: "string" },
                  suggested_deposit_multiplier: { type: "number" },
                },
                required: ["decision", "conditions", "reasoning", "suggested_deposit_multiplier"],
              },
              behavioral_insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    observation: { type: "string" },
                    impact: { type: "string", enum: ["positive", "neutral", "negative"] },
                  },
                  required: ["category", "observation", "impact"],
                },
              },
              summary: { type: "string" },
              confidence: { type: "number", description: "0-1" },
            },
            required: ["quality_score", "quality_grade", "payment_reliability", "risk_profile", "screening_recommendation", "behavioral_insights", "summary", "confidence"],
          },
        },
      },
    ],
    toolChoice: { type: "function", function: { name: "score_tenant_quality" } },
  });
}
