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

    const { tenant_user_id } = await req.json();
    if (!tenant_user_id) return errorResponse("tenant_user_id is required", 400);

    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "dss-collection-strategy", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    // Gather tenant data
    const [invoicesRes, collectionsRes, riskRes, contractRes, paymentMetricsRes, tenantProfileRes] = await Promise.all([
      serviceClient.from("invoices").select("*").eq("tenant_user_id", tenant_user_id).eq("merchant_id", merchantId).order("due_date", { ascending: false }).limit(30),
      serviceClient.from("collections_cases").select("*").eq("tenant_user_id", tenant_user_id).eq("merchant_id", merchantId),
      serviceClient.from("tenant_risk_scores").select("*").eq("tenant_user_id", tenant_user_id).eq("merchant_id", merchantId).maybeSingle(),
      serviceClient.from("contracts").select("*").eq("tenant_user_id", tenant_user_id).eq("merchant_id", merchantId).eq("status", "active").maybeSingle(),
      // Phase 6: Payment metrics
      serviceClient.from("tenant_payment_metrics").select("payment_score, avg_days_late, total_paid, total_unpaid, on_time_count, late_count").eq("tenant_user_id", tenant_user_id).eq("merchant_id", merchantId).maybeSingle(),
      // Phase 6: Tenant demographics
      serviceClient.from("tenants").select("age_group, occupation, income_range, gender, institution").eq("user_id", tenant_user_id).maybeSingle(),
    ]);

    const context = JSON.stringify({
      invoices: invoicesRes.data || [],
      collections: collectionsRes.data || [],
      riskScore: riskRes.data,
      contract: contractRes.data,
      tenantPaymentMetrics: paymentMetricsRes.data || null,
      tenantDemographics: tenantProfileRes.data || null,
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are a collections strategy advisor AI for Indonesian property management. Analyze payment history, risk scores, and escalation data to recommend the best collection approach per tenant. Be culturally appropriate for Indonesia.`,
      userContent: [{ type: "text", text: `Recommend collection strategy:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "collection_strategy",
            description: "Return collection strategy recommendation",
            parameters: {
              type: "object",
              properties: {
                approach: { type: "string", enum: ["friendly_reminder", "formal_notice", "escalation", "negotiation", "legal_warning"] },
                urgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
                recommended_channel: { type: "string", enum: ["whatsapp", "email", "phone", "in_person", "formal_letter"] },
                timing: { type: "string" },
                message_template: { type: "string" },
                escalation_steps: { type: "array", items: { type: "string" } },
                negotiation_options: { type: "array", items: { type: "string" } },
                summary: { type: "string" },
                confidence: { type: "number" },
              },
              required: ["approach", "urgency", "recommended_channel", "timing", "message_template", "summary", "confidence"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "collection_strategy" } },
    });

    const executionTimeMs = Date.now() - startTime;
    const strategy = aiResult.toolCallResult as any;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "dss-collection-strategy",
      merchantId,
      userId: auth.userId,
      inputSummary: `Tenant: ${tenant_user_id}`,
      outputSummary: strategy.summary,
      confidenceScore: strategy.confidence,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const recId = await createDssRecommendation(serviceClient, {
      merchantId,
      type: "collection",
      title: `Collection: ${strategy.approach} - ${strategy.urgency}`,
      description: strategy.summary,
      recommendationData: strategy,
      confidenceScore: strategy.confidence,
      mlModelRunId: modelRunId,
    });

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      recommendation_id: recId,
      strategy,
      execution_time_ms: executionTimeMs,
    });
  } catch (e) {
    console.error("dss-collection-strategy error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
