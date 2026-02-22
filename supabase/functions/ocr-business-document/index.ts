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
  professional: 10,
  enterprise: -1,
};

const BUSINESS_DOC_TOOL = {
  type: "function",
  function: {
    name: "extract_business_document",
    description: "Extract structured data from an Indonesian business document (NIB, SIUP, Akta Pendirian, or NPWP).",
    parameters: {
      type: "object",
      properties: {
        document_type: {
          type: "string",
          enum: ["NIB", "SIUP", "AKTA_PENDIRIAN", "NPWP"],
          description: "Detected document type",
        },
        // NIB fields
        nib_number: { type: "string", description: "NIB number (13 digits)" },
        // SIUP fields
        siup_number: { type: "string", description: "SIUP number" },
        business_category: { type: "string", description: "Business category (kecil/menengah/besar)" },
        // Akta fields
        akta_number: { type: "string", description: "Deed number" },
        notary_name: { type: "string", description: "Notary name" },
        akta_date: { type: "string", description: "Deed date" },
        // NPWP fields
        npwp_number: { type: "string", description: "NPWP number (15 digits)" },
        // Common fields
        business_name: { type: "string", description: "Registered business name" },
        business_address: { type: "string", description: "Business address" },
        owner_name: { type: "string", description: "Owner/director name" },
        issue_date: { type: "string", description: "Document issue date (YYYY-MM-DD)" },
        expiry_date: { type: "string", description: "Document expiry date if applicable" },
        issuing_authority: { type: "string", description: "Issuing authority/institution" },
        confidence: { type: "number", description: "Overall confidence 0-100" },
        field_confidences: { type: "object", additionalProperties: { type: "number" } },
      },
      required: ["document_type", "confidence"],
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

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ocr-business-document", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const { document_path, expected_type } = await req.json();
    if (!document_path) return errorResponse("Missing document_path", 400);

    const { base64, mimeType } = await downloadImageAsBase64(serviceClient, "verification-documents", document_path);

    const promptSuffix = expected_type ? ` The expected document type is ${expected_type}.` : "";

    const aiResult = await callLovableAI({
      systemPrompt:
        "You are an OCR specialist for Indonesian business documents. You can extract data from NIB, SIUP, Akta Pendirian, and NPWP documents. Identify the document type and extract all relevant fields.",
      userContent: [
        { type: "text", text: `Extract all data from this Indonesian business document.${promptSuffix}` },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
      tools: [BUSINESS_DOC_TOOL],
      toolChoice: { type: "function", function: { name: "extract_business_document" } },
    });

    const extractedData = aiResult.toolCallResult;
    const confidence = (extractedData.confidence as number) || 0;
    const requiresReview = confidence < 85;
    const processingTimeMs = Date.now() - startTime;

    const mlRunId = await logModelRun(serviceClient, {
      functionName: "ocr-business-document",
      merchantId,
      userId: auth.userId,
      inputSummary: `Business doc: ${document_path}, type: ${expected_type || "auto-detect"}`,
      outputSummary: `Type: ${extractedData.document_type}, Business: ${extractedData.business_name || "N/A"}`,
      confidenceScore: confidence,
      executionTimeMs: processingTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const ocrResultId = await createOcrResult(serviceClient, {
      userId: auth.userId,
      merchantId,
      documentType: "business_document",
      documentUrl: document_path,
      status: requiresReview ? "requires_review" : "completed",
      extractedData: extractedData as Record<string, unknown>,
      confidenceScore: confidence,
      requiresReview,
      mlModelRunId: mlRunId,
      processingTimeMs,
    });

    // Auto-populate merchant_verifications if confidence >= 85%
    if (!requiresReview && extractedData.document_type) {
      const docTypeMap: Record<string, string> = {
        NIB: "nib",
        SIUP: "siup",
        AKTA_PENDIRIAN: "akta",
        NPWP: "npwp",
      };
      const verDocType = docTypeMap[extractedData.document_type as string] || "other";

      await serviceClient.from("merchant_verifications").insert({
        merchant_id: merchantId,
        document_type: verDocType,
        document_url: document_path,
        status: "pending",
      });

      // Update business_name if different and confidence high
      if (extractedData.business_name && confidence >= 90) {
        const { data: merchant } = await serviceClient
          .from("merchants")
          .select("business_name")
          .eq("id", merchantId)
          .single();

        if (merchant && merchant.business_name !== extractedData.business_name) {
          await serviceClient
            .from("merchants")
            .update({
              business_name: extractedData.business_name as string,
              updated_at: new Date().toISOString(),
            })
            .eq("id", merchantId);
        }
      }
    }

    return successResponse({
      ocr_result_id: ocrResultId,
      ml_model_run_id: mlRunId,
      document_type: "business_document",
      detected_type: extractedData.document_type,
      status: requiresReview ? "requires_review" : "completed",
      confidence_score: confidence,
      requires_review: requiresReview,
      extracted_data: extractedData,
      processing_time_ms: processingTimeMs,
      tier: { name: tierCheck.tierName, usage: tierCheck.currentUsage + 1, limit: tierCheck.limit },
    });
  } catch (error) {
    console.error("OCR Business Document error:", error);
    if (error instanceof AiGatewayError) return errorResponse(error.message, error.status);
    return errorResponse(`OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`, 500);
  }
});
