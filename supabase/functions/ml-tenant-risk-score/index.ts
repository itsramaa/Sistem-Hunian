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
  upsertRiskScore,
  errorResponse,
  successResponse,
} from "../_shared/dss-utils.ts";

const TIER_LIMITS = { free: 0, starter: 3, professional: 20, enterprise: -1 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createUserClient(authHeader);
  const serviceClient = createServiceClient();

  try {
    const auth = await authenticateUser(req, userClient);
    if (auth.error) return auth.error;

    const { tenant_user_id, batch } = await req.json();
    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ml-tenant-risk-score", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    // Get tenant(s) to score
    let tenantIds: string[] = [];
    if (batch) {
      const { data: contracts } = await serviceClient
        .from("contracts")
        .select("tenant_user_id")
        .eq("merchant_id", merchantId)
        .eq("status", "active");
      tenantIds = [...new Set((contracts || []).map((c) => c.tenant_user_id))];
    } else if (tenant_user_id) {
      tenantIds = [tenant_user_id];
    } else {
      return errorResponse("Provide tenant_user_id or set batch=true", 400);
    }

    const results: any[] = [];

    for (const tid of tenantIds) {
      // Aggregate tenant-specific data
      const { data: invoices } = await serviceClient
        .from("invoices")
        .select("id, amount, status, due_date, paid_at, late_fee")
        .eq("tenant_user_id", tid)
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: collections } = await serviceClient
        .from("collections_cases")
        .select("id, status, escalation_level, days_overdue, total_due")
        .eq("tenant_user_id", tid)
        .eq("merchant_id", merchantId);

      const { data: maintenance } = await serviceClient
        .from("maintenance_requests")
        .select("id, status, priority")
        .eq("tenant_user_id", tid)
        .eq("merchant_id", merchantId)
        .limit(20);

      const { data: contract } = await serviceClient
        .from("contracts")
        .select("id, start_date, end_date, rent_amount, status, move_out_notice_given")
        .eq("tenant_user_id", tid)
        .eq("merchant_id", merchantId)
        .eq("status", "active")
        .maybeSingle();

      const context = JSON.stringify({
        invoices: invoices || [],
        collections: collections || [],
        maintenance: maintenance || [],
        contract,
        currentDate: new Date().toISOString(),
      });

      const aiResult = await callLovableAI({
        systemPrompt: `You are a tenant risk assessment AI for an Indonesian property management platform. Analyze payment history, collections, maintenance requests, and contract data to produce a risk score 0-100. Higher = riskier.`,
        userContent: [{ type: "text", text: `Assess risk for tenant based on:\n${context}` }],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_risk",
              description: "Return tenant risk assessment",
              parameters: {
                type: "object",
                properties: {
                  risk_score: { type: "number", description: "0-100" },
                  risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  factors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        factor: { type: "string" },
                        impact: { type: "string", enum: ["positive", "negative", "neutral"] },
                        weight: { type: "number" },
                        detail: { type: "string" },
                      },
                      required: ["factor", "impact", "weight", "detail"],
                    },
                  },
                  recommended_actions: { type: "array", items: { type: "string" } },
                  summary: { type: "string" },
                },
                required: ["risk_score", "risk_level", "factors", "recommended_actions", "summary"],
              },
            },
          },
        ],
        toolChoice: { type: "function", function: { name: "assess_risk" } },
      });

      const score = aiResult.toolCallResult as any;

      const modelRunId = await logModelRun(serviceClient, {
        functionName: "ml-tenant-risk-score",
        merchantId,
        userId: auth.userId,
        inputSummary: `Tenant: ${tid}`,
        outputSummary: `Score: ${score.risk_score}, Level: ${score.risk_level}`,
        confidenceScore: score.risk_score / 100,
        executionTimeMs: Date.now() - startTime,
        tokensUsed: aiResult.tokensUsed,
      });

      await upsertRiskScore(serviceClient, {
        tenantUserId: tid,
        merchantId,
        riskScore: score.risk_score,
        riskLevel: score.risk_level,
        factors: { factors: score.factors, recommended_actions: score.recommended_actions },
        mlModelRunId: modelRunId,
      });

      // Notify if critical
      if (score.risk_score >= 76) {
        await serviceClient.from("notifications").insert({
          user_id: auth.userId,
          title: `⚠️ Tenant Risk Alert: ${score.risk_level}`,
          message: `Tenant risk score: ${score.risk_score}/100. ${score.summary}`,
          type: "risk_alert",
          metadata: { tenant_user_id: tid, risk_score: score.risk_score },
        }).then(() => {}).catch(() => {});
      }

      results.push({ tenant_user_id: tid, ...score, model_run_id: modelRunId });
    }

    return successResponse({
      success: true,
      results,
      batch: batch || false,
      execution_time_ms: Date.now() - startTime,
    });
  } catch (e) {
    console.error("ml-tenant-risk-score error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
