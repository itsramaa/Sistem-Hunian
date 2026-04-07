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

    const { window_months = 3 } = await req.json();
    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ml-churn-prediction", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    // Get active tenants with their data
    const { data: contracts } = await serviceClient
      .from("contracts")
      .select("id, tenant_user_id, start_date, end_date, rent_amount, status, move_out_notice_given, move_out_notice_date")
      .eq("merchant_id", merchantId)
      .eq("status", "active");

    const tenantIds = [...new Set((contracts || []).map((c) => c.tenant_user_id))];

    const { data: invoices } = await serviceClient
      .from("invoices")
      .select("id, tenant_user_id, status, due_date, paid_at, late_fee")
      .eq("merchant_id", merchantId)
      .in("tenant_user_id", tenantIds)
      .order("created_at", { ascending: false })
      .limit(200);

    const { data: maintenance } = await serviceClient
      .from("maintenance_requests")
      .select("id, tenant_user_id, status, priority, created_at")
      .eq("merchant_id", merchantId)
      .in("tenant_user_id", tenantIds)
      .limit(100);

    const context = JSON.stringify({
      contracts: contracts || [],
      invoices: invoices || [],
      maintenance: maintenance || [],
      windowMonths: window_months,
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are a tenant churn prediction AI for Indonesian property management. Analyze payment delays, maintenance complaints, contract proximity to end, and move-out notices to predict churn probability per tenant.`,
      userContent: [{ type: "text", text: `Predict churn for tenants within ${window_months} months:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "predict_churn",
            description: "Return churn predictions per tenant",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tenant_user_id: { type: "string" },
                      churn_probability: { type: "number", description: "0-1" },
                      risk_factors: { type: "array", items: { type: "string" } },
                      retention_suggestions: { type: "array", items: { type: "string" } },
                    },
                    required: ["tenant_user_id", "churn_probability", "risk_factors", "retention_suggestions"],
                  },
                },
                summary: { type: "string" },
                high_risk_count: { type: "number" },
              },
              required: ["predictions", "summary", "high_risk_count"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "predict_churn" } },
    });

    const executionTimeMs = Date.now() - startTime;
    const prediction = aiResult.toolCallResult as any;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "ml-churn-prediction",
      merchantId,
      userId: auth.userId,
      inputSummary: `${tenantIds.length} tenants, ${window_months}mo window`,
      outputSummary: prediction.summary,
      executionTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    // Notify for high-risk tenants
    for (const p of prediction.predictions || []) {
      if (p.churn_probability > 0.6) {
        await serviceClient.from("notifications").insert({
          user_id: auth.userId,
          title: `⚠️ Churn Risk: Tenant may leave`,
          message: `Churn probability: ${Math.round(p.churn_probability * 100)}%. ${p.risk_factors?.[0] || ""}`,
          type: "churn_alert",
          metadata: { tenant_user_id: p.tenant_user_id, churn_probability: p.churn_probability },
        }).then(() => {}).catch(() => {});
      }
    }

    return successResponse({
      success: true,
      model_run_id: modelRunId,
      churn: prediction,
      execution_time_ms: executionTimeMs,
    });
  } catch (e) {
    console.error("ml-churn-prediction error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
