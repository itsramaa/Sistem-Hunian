import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createServiceClient,
  createUserClient,
  authenticateUser,
  checkTierLimit,
  getMerchantId,
  downloadImageAsBase64,
  callLovableAI,
  AiGatewayError,
  logModelRun,
  createOcrResult,
  errorResponse,
  successResponse,
} from "../_shared/dss-utils.ts";

const TIER_LIMITS = {
  free: 0,
  basic: 0,
  professional: 15,
  enterprise: -1,
};

const CONTRACT_TOOL = {
  type: "function",
  function: {
    name: "extract_contract_data",
    description: "Extract structured data from a physical rental/lease contract document.",
    parameters: {
      type: "object",
      properties: {
        tenant_name: { type: "string", description: "Tenant/renter full name" },
        landlord_name: { type: "string", description: "Landlord/owner name" },
        property_address: { type: "string", description: "Property or unit address" },
        unit_number: { type: "string", description: "Unit number if visible" },
        rent_amount: { type: "number", description: "Monthly rent amount in IDR" },
        deposit_amount: { type: "number", description: "Deposit amount in IDR" },
        start_date: { type: "string", description: "Contract start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "Contract end date (YYYY-MM-DD)" },
        duration_months: { type: "number", description: "Contract duration in months" },
        payment_terms: { type: "string", description: "Payment frequency and terms" },
        key_clauses: {
          type: "array",
          items: { type: "string" },
          description: "Key contract clauses or terms",
        },
        penalties: { type: "string", description: "Penalty terms for early termination" },
        confidence: { type: "number", description: "Overall confidence 0-100" },
        field_confidences: { type: "object", additionalProperties: { type: "number" } },
      },
      required: ["confidence"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createUserClient(authHeader);
    const auth = await authenticateUser(req, userClient);
    if (auth.error) return auth.error;

    const serviceClient = createServiceClient();
    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant account not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ocr-contract-document", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const { document_path } = await req.json();
    if (!document_path) return errorResponse("Missing document_path", 400);

    const { base64, mimeType } = await downloadImageAsBase64(serviceClient, "contract-documents", document_path);

    const aiResult = await callLovableAI({
      systemPrompt:
        "You are an OCR specialist for Indonesian rental/lease contracts (kontrak sewa). Extract all key contract terms including parties, amounts, dates, and clauses. Amounts should be in IDR (Indonesian Rupiah).",
      userContent: [
        { type: "text", text: "Extract all key data from this rental contract document." },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
      tools: [CONTRACT_TOOL],
      toolChoice: { type: "function", function: { name: "extract_contract_data" } },
    });

    const extractedData = aiResult.toolCallResult;
    const confidence = (extractedData.confidence as number) || 0;
    const requiresReview = confidence < 80;
    const processingTimeMs = Date.now() - startTime;

    const mlRunId = await logModelRun(serviceClient, {
      functionName: "ocr-contract-document",
      merchantId,
      userId: auth.userId,
      inputSummary: `Contract: ${document_path}`,
      outputSummary: `Tenant: ${extractedData.tenant_name || "N/A"}, Rent: ${extractedData.rent_amount || "N/A"}`,
      confidenceScore: confidence,
      executionTimeMs: processingTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const ocrResultId = await createOcrResult(serviceClient, {
      userId: auth.userId,
      merchantId,
      documentType: "contract",
      documentUrl: document_path,
      status: requiresReview ? "requires_review" : "completed",
      extractedData: extractedData as Record<string, unknown>,
      confidenceScore: confidence,
      requiresReview,
      mlModelRunId: mlRunId,
      processingTimeMs,
    });

    return successResponse({
      ocr_result_id: ocrResultId,
      ml_model_run_id: mlRunId,
      document_type: "contract",
      status: requiresReview ? "requires_review" : "completed",
      confidence_score: confidence,
      requires_review: requiresReview,
      extracted_data: extractedData,
      processing_time_ms: processingTimeMs,
      tier: { name: tierCheck.tierName, usage: tierCheck.currentUsage + 1, limit: tierCheck.limit },
    });
  } catch (error) {
    console.error("OCR Contract error:", error);
    if (error instanceof AiGatewayError) return errorResponse(error.message, error.status);
    return errorResponse(`OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`, 500);
  }
});
