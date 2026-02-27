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
  free: 5,
  basic: 15,
  professional: 50,
  enterprise: -1,
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  utilities: ["listrik", "pln", "air", "pdam", "gas", "internet", "wifi", "telkom", "indihome"],
  maintenance: ["perbaikan", "service", "reparasi", "tukang", "material", "cat", "pipa", "kunci"],
  insurance: ["asuransi", "premi", "polis"],
  tax: ["pajak", "pbb", "ppn", "pph"],
  marketing: ["iklan", "promosi", "marketing", "ads", "flyer", "banner"],
  admin: ["atk", "alat tulis", "kertas", "tinta", "printer", "fotocopy"],
  payroll: ["gaji", "upah", "honor", "thr", "bonus"],
};

function suggestCategory(vendorName?: string, description?: string): string {
  const text = `${vendorName || ""} ${description || ""}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return category;
  }
  return "other";
}

const RECEIPT_TOOL = {
  type: "function",
  function: {
    name: "extract_expense_receipt",
    description: "Extract structured data from an expense receipt/nota/invoice image for property management.",
    parameters: {
      type: "object",
      properties: {
        vendor_name: { type: "string", description: "Vendor/store/company name" },
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
        },
        total_amount: { type: "number", description: "Total amount in IDR" },
        payment_method: { type: "string", description: "Payment method (cash/transfer/qris/card)" },
        suggested_category: { type: "string", description: "Suggested expense category based on content" },
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

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ocr-expense-receipt", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const { document_path } = await req.json();
    if (!document_path) return errorResponse("Missing document_path", 400);

    const { base64, mimeType } = await downloadImageAsBase64(serviceClient, "verification-documents", document_path);

    const aiResult = await callLovableAI({
      systemPrompt:
        "You are an OCR specialist for Indonesian receipts and invoices (nota/kwitansi/faktur). Extract vendor name, date, items, total amount, and payment method. Suggest a category from: utilities, maintenance, insurance, tax, marketing, admin, payroll, other.",
      userContent: [
        { type: "text", text: "Extract all data from this expense receipt image for property management accounting." },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
      tools: [RECEIPT_TOOL],
      toolChoice: { type: "function", function: { name: "extract_expense_receipt" } },
    });

    const extractedData = aiResult.toolCallResult;
    const confidence = (extractedData.confidence as number) || 0;
    const requiresReview = confidence < 80;
    const processingTimeMs = Date.now() - startTime;

    // Enhance category suggestion with keyword matching
    const aiCategory = extractedData.suggested_category as string;
    const keywordCategory = suggestCategory(
      extractedData.vendor_name as string,
      (extractedData.line_items as any[])?.map(i => i.description).join(" ")
    );
    extractedData.suggested_category = aiCategory || keywordCategory;

    const mlRunId = await logModelRun(serviceClient, {
      functionName: "ocr-expense-receipt",
      merchantId,
      userId: auth.userId,
      inputSummary: `Receipt: ${document_path}`,
      outputSummary: `Vendor: ${extractedData.vendor_name || "N/A"}, Total: Rp${extractedData.total_amount || 0}, Category: ${extractedData.suggested_category}`,
      confidenceScore: confidence,
      executionTimeMs: processingTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const ocrResultId = await createOcrResult(serviceClient, {
      userId: auth.userId,
      merchantId,
      documentType: "expense_receipt",
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
      document_type: "expense_receipt",
      status: requiresReview ? "requires_review" : "completed",
      confidence_score: confidence,
      requires_review: requiresReview,
      extracted_data: extractedData,
      processing_time_ms: processingTimeMs,
      tier: { name: tierCheck.tierName, usage: tierCheck.currentUsage + 1, limit: tierCheck.limit },
    });
  } catch (error) {
    console.error("OCR Expense Receipt error:", error);
    if (error instanceof AiGatewayError) return errorResponse(error.message, error.status);
    return errorResponse(`OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`, 500);
  }
});
