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
  professional: 20,
  enterprise: -1,
};

const RECEIPT_TOOL = {
  type: "function",
  function: {
    name: "extract_maintenance_receipt",
    description: "Extract structured data from a maintenance receipt/nota image.",
    parameters: {
      type: "object",
      properties: {
        vendor_name: { type: "string", description: "Vendor/store name" },
        receipt_number: { type: "string", description: "Receipt/nota number" },
        receipt_date: { type: "string", description: "Receipt date (YYYY-MM-DD)" },
        line_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unit_price: { type: "number" },
              total: { type: "number" },
            },
            required: ["description", "total"],
          },
          description: "Line items on the receipt",
        },
        subtotal: { type: "number", description: "Subtotal before tax" },
        tax_amount: { type: "number", description: "Tax amount if any" },
        total_amount: { type: "number", description: "Total amount" },
        payment_method: { type: "string", description: "Payment method (cash/transfer/etc)" },
        confidence: { type: "number", description: "Overall confidence 0-100" },
        field_confidences: { type: "object", additionalProperties: { type: "number" } },
      },
      required: ["total_amount", "confidence"],
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

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ocr-maintenance-receipt", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const { document_path, maintenance_request_id } = await req.json();
    if (!document_path) return errorResponse("Missing document_path", 400);
    if (!maintenance_request_id) return errorResponse("Missing maintenance_request_id", 400);

    // Verify maintenance request belongs to this merchant
    const { data: maintenanceReq } = await serviceClient
      .from("maintenance_requests")
      .select("id, merchant_id")
      .eq("id", maintenance_request_id)
      .eq("merchant_id", merchantId)
      .single();

    if (!maintenanceReq) {
      return errorResponse("Maintenance request not found or access denied", 404);
    }

    const { base64, mimeType } = await downloadImageAsBase64(serviceClient, "maintenance-photos", document_path);

    const aiResult = await callLovableAI({
      systemPrompt:
        "You are an OCR specialist for Indonesian receipts and invoices (nota/kwitansi). Extract all items, amounts, vendor info, and dates from the receipt image.",
      userContent: [
        { type: "text", text: "Extract all data from this maintenance receipt/nota image." },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
      tools: [RECEIPT_TOOL],
      toolChoice: { type: "function", function: { name: "extract_maintenance_receipt" } },
    });

    const extractedData = aiResult.toolCallResult;
    const confidence = (extractedData.confidence as number) || 0;
    const requiresReview = confidence < 80;
    const processingTimeMs = Date.now() - startTime;

    const mlRunId = await logModelRun(serviceClient, {
      functionName: "ocr-maintenance-receipt",
      merchantId,
      userId: auth.userId,
      inputSummary: `Receipt: ${document_path}, request: ${maintenance_request_id}`,
      outputSummary: `Vendor: ${extractedData.vendor_name || "N/A"}, Total: Rp${extractedData.total_amount || 0}`,
      confidenceScore: confidence,
      executionTimeMs: processingTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const ocrResultId = await createOcrResult(serviceClient, {
      userId: auth.userId,
      merchantId,
      documentType: "maintenance_receipt",
      documentUrl: document_path,
      status: requiresReview ? "requires_review" : "completed",
      extractedData: extractedData as Record<string, unknown>,
      confidenceScore: confidence,
      requiresReview,
      mlModelRunId: mlRunId,
      processingTimeMs,
    });

    // Create maintenance_expenses record
    const { data: expense } = await serviceClient
      .from("maintenance_expenses")
      .insert({
        maintenance_request_id,
        ocr_result_id: ocrResultId,
        merchant_id: merchantId,
        vendor_name: extractedData.vendor_name as string,
        receipt_number: extractedData.receipt_number as string,
        receipt_date: extractedData.receipt_date as string,
        line_items: extractedData.line_items || [],
        subtotal: (extractedData.subtotal as number) || (extractedData.total_amount as number) || 0,
        tax_amount: (extractedData.tax_amount as number) || 0,
        total_amount: (extractedData.total_amount as number) || 0,
      })
      .select("id")
      .single();

    return successResponse({
      ocr_result_id: ocrResultId,
      ml_model_run_id: mlRunId,
      expense_id: expense?.id,
      document_type: "maintenance_receipt",
      status: requiresReview ? "requires_review" : "completed",
      confidence_score: confidence,
      requires_review: requiresReview,
      extracted_data: extractedData,
      processing_time_ms: processingTimeMs,
      tier: { name: tierCheck.tierName, usage: tierCheck.currentUsage + 1, limit: tierCheck.limit },
    });
  } catch (error) {
    console.error("OCR Maintenance Receipt error:", error);
    if (error instanceof AiGatewayError) return errorResponse(error.message, error.status);
    return errorResponse(`OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`, 500);
  }
});
