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

const TIER_LIMITS = { free: 0, basic: 0, professional: 10, enterprise: -1 };

const COMPLIANCE_DOC_TOOL = {
  type: "function",
  function: {
    name: "extract_compliance_document",
    description: "Extract structured data from Indonesian compliance documents (IMB, PBB, Insurance Policy, or Maintenance Invoice).",
    parameters: {
      type: "object",
      properties: {
        document_type: {
          type: "string",
          enum: ["IMB", "PBB", "POLIS_ASURANSI", "INVOICE_MAINTENANCE"],
          description: "Detected document type",
        },
        // IMB fields
        imb_number: { type: "string", description: "IMB permit number" },
        owner_name: { type: "string", description: "Property owner name" },
        address: { type: "string", description: "Property address" },
        building_area: { type: "number", description: "Building area in m²" },
        building_function: { type: "string", description: "Building function/use" },
        // PBB fields
        nop: { type: "string", description: "NOP (Nomor Objek Pajak)" },
        tax_year: { type: "number", description: "Tax year" },
        njop: { type: "number", description: "NJOP value" },
        land_area: { type: "number", description: "Land area in m²" },
        tax_amount: { type: "number", description: "Tax amount in IDR" },
        due_date: { type: "string", description: "Payment due date (YYYY-MM-DD)" },
        // Insurance fields
        policy_number: { type: "string", description: "Insurance policy number" },
        insurance_company: { type: "string", description: "Insurance company name" },
        premium_amount: { type: "number", description: "Premium amount in IDR" },
        coverage_amount: { type: "number", description: "Coverage amount in IDR" },
        coverage_type: { type: "string", description: "Type of coverage" },
        start_date: { type: "string", description: "Policy start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "Policy end date (YYYY-MM-DD)" },
        // Invoice Maintenance fields
        invoice_number: { type: "string", description: "Invoice number" },
        vendor_name: { type: "string", description: "Vendor/contractor name" },
        work_description: { type: "string", description: "Work or service description" },
        total_cost: { type: "number", description: "Total cost in IDR" },
        invoice_date: { type: "string", description: "Invoice date (YYYY-MM-DD)" },
        // Common
        issue_date: { type: "string", description: "Document issue date (YYYY-MM-DD)" },
        document_name: { type: "string", description: "Document title or name" },
        confidence: { type: "number", description: "Overall confidence 0-100" },
        field_confidences: { type: "object", additionalProperties: { type: "number" } },
      },
      required: ["document_type", "confidence"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createUserClient(authHeader);
    const auth = await authenticateUser(req, userClient);
    if (auth.error) return auth.error;

    const serviceClient = createServiceClient();
    const merchantId = await getMerchantId(serviceClient, auth.userId);
    if (!merchantId) return errorResponse("Merchant account not found", 404);

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ocr-compliance-document", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const { document_path, expected_type, property_id, bucket } = await req.json();
    if (!document_path) return errorResponse("Missing document_path", 400);
    if (!property_id) return errorResponse("Missing property_id", 400);

    const storageBucket = bucket || "verification-documents";
    const { base64, mimeType } = await downloadImageAsBase64(serviceClient, storageBucket, document_path);

    const promptSuffix = expected_type ? ` The expected document type is ${expected_type}.` : "";

    const aiResult = await callLovableAI({
      systemPrompt:
        "You are an OCR specialist for Indonesian property compliance documents. You can extract data from IMB (building permits), PBB (property tax), Insurance Policies, and Maintenance Invoices. Identify the document type and extract all relevant fields accurately.",
      userContent: [
        { type: "text", text: `Extract all data from this Indonesian compliance document.${promptSuffix}` },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
      tools: [COMPLIANCE_DOC_TOOL],
      toolChoice: { type: "function", function: { name: "extract_compliance_document" } },
    });

    const extractedData = aiResult.toolCallResult;
    const confidence = (extractedData.confidence as number) || 0;
    const requiresReview = confidence < 85;
    const processingTimeMs = Date.now() - startTime;

    const mlRunId = await logModelRun(serviceClient, {
      functionName: "ocr-compliance-document",
      merchantId,
      userId: auth.userId,
      inputSummary: `Compliance doc: ${document_path}, type: ${expected_type || "auto-detect"}`,
      outputSummary: `Type: ${extractedData.document_type}, Name: ${extractedData.document_name || "N/A"}`,
      confidenceScore: confidence,
      executionTimeMs: processingTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const ocrResultId = await createOcrResult(serviceClient, {
      userId: auth.userId,
      merchantId,
      documentType: "compliance_document",
      documentUrl: document_path,
      status: requiresReview ? "requires_review" : "completed",
      extractedData: extractedData as Record<string, unknown>,
      confidenceScore: confidence,
      requiresReview,
      mlModelRunId: mlRunId,
      processingTimeMs,
    });

    // Auto-populate compliance_documents if confidence is high
    if (!requiresReview && extractedData.document_type) {
      const docTypeMap: Record<string, string> = {
        IMB: "imb",
        PBB: "pbb",
        POLIS_ASURANSI: "insurance_policy",
        INVOICE_MAINTENANCE: "maintenance_invoice",
      };
      const docType = docTypeMap[extractedData.document_type as string] || "other";

      await serviceClient.from("compliance_documents").insert({
        property_id,
        merchant_id: merchantId,
        document_type: docType,
        document_name: (extractedData.document_name as string) || `${extractedData.document_type} - OCR Extracted`,
        document_url: document_path,
        issue_date: (extractedData.issue_date as string) || (extractedData.invoice_date as string) || null,
        expiry_date: (extractedData.end_date as string) || (extractedData.due_date as string) || null,
        status: "valid",
        notes: `Auto-extracted via OCR (confidence: ${confidence}%)`,
      });

      // If insurance, also create insurance policy
      if (extractedData.document_type === "POLIS_ASURANSI" && extractedData.policy_number) {
        await serviceClient.from("insurance_policies").insert({
          property_id,
          merchant_id: merchantId,
          policy_number: extractedData.policy_number as string,
          policy_type: (extractedData.coverage_type as string) || "comprehensive",
          provider: (extractedData.insurance_company as string) || "Unknown",
          coverage_amount: (extractedData.coverage_amount as number) || 0,
          premium_amount: (extractedData.premium_amount as number) || 0,
          start_date: (extractedData.start_date as string) || new Date().toISOString().split("T")[0],
          end_date: (extractedData.end_date as string) || new Date().toISOString().split("T")[0],
          status: "active",
        });
      }
    }

    return successResponse({
      ocr_result_id: ocrResultId,
      ml_model_run_id: mlRunId,
      document_type: "compliance_document",
      detected_type: extractedData.document_type,
      status: requiresReview ? "requires_review" : "completed",
      confidence_score: confidence,
      requires_review: requiresReview,
      extracted_data: extractedData,
      processing_time_ms: processingTimeMs,
      auto_populated: !requiresReview,
      tier: { name: tierCheck.tierName, usage: tierCheck.currentUsage + 1, limit: tierCheck.limit },
    });
  } catch (error) {
    console.error("OCR Compliance Document error:", error);
    if (error instanceof AiGatewayError) return errorResponse(error.message, error.status);
    return errorResponse(`OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`, 500);
  }
});
