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

    const { property_id, discount_rate = 12 } = await req.json();
    if (!property_id) return errorResponse("property_id is required", 400);

    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ml-financial-analytics", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    // Fetch property details
    const { data: property } = await serviceClient
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .eq("merchant_id", merchantId)
      .single();
    if (!property) return errorResponse("Property not found", 404);

    // Fetch units
    const { data: units } = await serviceClient
      .from("units")
      .select("id, unit_number, unit_type, rent_price, status, amenities, property_id")
      .eq("property_id", property_id);

    // Fetch contracts (24 months)
    const since24m = new Date();
    since24m.setMonth(since24m.getMonth() - 24);
    const { data: contracts } = await serviceClient
      .from("contracts")
      .select("id, unit_id, rent_amount, start_date, end_date, status")
      .eq("merchant_id", merchantId)
      .gte("start_date", since24m.toISOString())
      .order("start_date", { ascending: false })
      .limit(300);

    // Fetch invoices (24 months)
    const { data: invoices } = await serviceClient
      .from("invoices")
      .select("id, amount, status, paid_at, due_date, late_fee, total_amount")
      .eq("merchant_id", merchantId)
      .gte("due_date", since24m.toISOString().split("T")[0])
      .order("due_date", { ascending: false })
      .limit(500);

    // Fetch maintenance expenses (24 months)
    const { data: maintenanceExpenses } = await serviceClient
      .from("maintenance_expenses")
      .select("id, total_amount, created_at")
      .eq("merchant_id", merchantId)
      .gte("created_at", since24m.toISOString())
      .limit(300);

    // Fetch occupancy snapshots
    const { data: snapshots } = await serviceClient
      .from("occupancy_snapshots")
      .select("property_id, snapshot_date, total_units, occupied_units, occupancy_rate")
      .eq("property_id", property_id)
      .order("snapshot_date", { ascending: false })
      .limit(100);

    const context = JSON.stringify({
      property,
      units: units || [],
      contracts: contracts || [],
      invoices: invoices || [],
      maintenanceExpenses: maintenanceExpenses || [],
      occupancySnapshots: snapshots || [],
      discountRate: discount_rate,
      currentDate: new Date().toISOString(),
    });

    const aiResult = await callLovableAI({
      systemPrompt: `You are a financial analytics AI for a property management (kosan/boarding house) platform in Indonesia.
Analyze the property data to provide:
1. ROI & Payback Period analysis based on total investment (construction_cost + renovation_cost) and net income
2. NPV & IRR analysis using the provided discount rate, with multi-year cash flow projections
3. Sensitivity analysis for key variables (occupancy rate, rent price, maintenance costs, etc.)
4. Break-even analysis showing minimum units/occupancy needed
Currency is IDR. Be precise with calculations and realistic with projections.
If construction_cost or renovation_cost is not available, estimate total investment from available data.`,
      userContent: [{ type: "text", text: `Perform financial analysis:\n${context}` }],
      tools: [
        {
          type: "function",
          function: {
            name: "financial_analysis",
            description: "Return comprehensive financial analysis with ROI, NPV/IRR, sensitivity, and break-even",
            parameters: {
              type: "object",
              properties: {
                roi_analysis: {
                  type: "object",
                  properties: {
                    total_investment: { type: "number" },
                    annual_revenue: { type: "number" },
                    annual_expenses: { type: "number" },
                    net_annual_income: { type: "number" },
                    roi_percentage: { type: "number" },
                    payback_period_years: { type: "number" },
                  },
                  required: ["total_investment", "annual_revenue", "annual_expenses", "net_annual_income", "roi_percentage", "payback_period_years"],
                },
                npv_irr: {
                  type: "object",
                  properties: {
                    npv: { type: "number" },
                    irr: { type: "number" },
                    discount_rate_used: { type: "number" },
                    cash_flows: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          year: { type: "number" },
                          revenue: { type: "number" },
                          expenses: { type: "number" },
                          net: { type: "number" },
                        },
                        required: ["year", "revenue", "expenses", "net"],
                      },
                    },
                    recommendation: { type: "string", enum: ["invest", "hold", "divest"] },
                  },
                  required: ["npv", "irr", "discount_rate_used", "cash_flows", "recommendation"],
                },
                sensitivity: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      scenario_name: { type: "string" },
                      variable_changed: { type: "string" },
                      change_percentage: { type: "number" },
                      resulting_roi: { type: "number" },
                      resulting_npv: { type: "number" },
                      impact_level: { type: "string", enum: ["low", "medium", "high"] },
                    },
                    required: ["scenario_name", "variable_changed", "change_percentage", "resulting_roi", "resulting_npv", "impact_level"],
                  },
                },
                break_even: {
                  type: "object",
                  properties: {
                    monthly_fixed_costs: { type: "number" },
                    variable_cost_per_unit: { type: "number" },
                    avg_revenue_per_unit: { type: "number" },
                    break_even_units: { type: "number" },
                    break_even_occupancy_rate: { type: "number" },
                    months_to_break_even: { type: "number" },
                  },
                  required: ["monthly_fixed_costs", "variable_cost_per_unit", "avg_revenue_per_unit", "break_even_units", "break_even_occupancy_rate", "months_to_break_even"],
                },
                summary: { type: "string" },
                confidence: { type: "number", description: "0-1" },
              },
              required: ["roi_analysis", "npv_irr", "sensitivity", "break_even", "summary", "confidence"],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "financial_analysis" } },
    });

    const executionTimeMs = Date.now() - startTime;

    const modelRunId = await logModelRun(serviceClient, {
      functionName: "ml-financial-analytics",
      merchantId,
      userId: auth.userId,
      inputSummary: `Financial analysis for property ${property_id}, discount_rate: ${discount_rate}%`,
      outputSummary: aiResult.toolCallResult.summary as string,
      confidenceScore: aiResult.toolCallResult.confidence as number,
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
    console.error("ml-financial-analytics error:", e);
    if (e instanceof AiGatewayError) return errorResponse(e.message, e.status);
    return errorResponse(e instanceof Error ? e.message : "Internal error", 500);
  }
});
