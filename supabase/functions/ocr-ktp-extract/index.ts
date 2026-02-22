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

const KTP_TOOL = {
  type: "function",
  function: {
    name: "extract_ktp_data",
    description: "Extract structured data from an Indonesian KTP (identity card) image.",
    parameters: {
      type: "object",
      properties: {
        nik: { type: "string", description: "16-digit NIK number" },
        nama: { type: "string", description: "Full name" },
        tempat_lahir: { type: "string", description: "Place of birth" },
        tanggal_lahir: { type: "string", description: "Date of birth (DD-MM-YYYY)" },
        jenis_kelamin: { type: "string", enum: ["LAKI-LAKI", "PEREMPUAN"], description: "Gender" },
        alamat: { type: "string", description: "Full address" },
        rt_rw: { type: "string", description: "RT/RW" },
        kelurahan: { type: "string", description: "Village/Kelurahan" },
        kecamatan: { type: "string", description: "District/Kecamatan" },
        agama: { type: "string", description: "Religion" },
        status_perkawinan: { type: "string", description: "Marital status" },
        pekerjaan: { type: "string", description: "Occupation" },
        kewarganegaraan: { type: "string", description: "Citizenship" },
        berlaku_hingga: { type: "string", description: "Valid until date or SEUMUR HIDUP" },
        confidence: { type: "number", description: "Overall confidence score 0-100" },
        field_confidences: {
          type: "object",
          description: "Per-field confidence scores 0-100",
          additionalProperties: { type: "number" },
        },
      },
      required: ["nik", "nama", "confidence"],
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

    if (!merchantId) {
      return errorResponse("Merchant account not found", 404);
    }

    // Tier check
    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ocr-ktp-extract", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const { document_path } = await req.json();
    if (!document_path) {
      return errorResponse("Missing document_path", 400);
    }

    // Download image
    const { base64, mimeType } = await downloadImageAsBase64(serviceClient, "verification-documents", document_path);

    // Call AI
    const aiResult = await callLovableAI({
      systemPrompt:
        "You are an OCR specialist for Indonesian KTP (identity cards). Extract all visible fields from the KTP image with high accuracy. Return confidence scores for each field.",
      userContent: [
        { type: "text", text: "Extract all data from this KTP image." },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
      tools: [KTP_TOOL],
      toolChoice: { type: "function", function: { name: "extract_ktp_data" } },
    });

    const extractedData = aiResult.toolCallResult;
    const confidence = (extractedData.confidence as number) || 0;
    const requiresReview = confidence < 80;
    const processingTimeMs = Date.now() - startTime;

    // Log model run
    const mlRunId = await logModelRun(serviceClient, {
      functionName: "ocr-ktp-extract",
      merchantId,
      userId: auth.userId,
      inputSummary: `KTP image: ${document_path}`,
      outputSummary: `NIK: ${extractedData.nik || "N/A"}, Name: ${extractedData.nama || "N/A"}`,
      confidenceScore: confidence,
      executionTimeMs: processingTimeMs,
      tokensUsed: aiResult.tokensUsed,
      metadata: { tier: tierCheck.tierName, usage: tierCheck.currentUsage + 1 },
    });

    // Create OCR result
    const ocrResultId = await createOcrResult(serviceClient, {
      userId: auth.userId,
      merchantId,
      documentType: "ktp",
      documentUrl: document_path,
      status: requiresReview ? "requires_review" : "completed",
      extractedData: extractedData as Record<string, unknown>,
      confidenceScore: confidence,
      requiresReview,
      mlModelRunId: mlRunId,
      processingTimeMs,
    });

    // Auto-populate tenant profile if confidence >= 80%
    if (!requiresReview && extractedData.nik) {
      // Find tenant linked to this merchant
      const { data: tenants } = await serviceClient
        .from("tenants")
        .select("id, user_id")
        .eq("linked_merchant_id", merchantId);

      // Try to match by user_id (the uploader)
      const matchedTenant = tenants?.find((t) => t.user_id === auth.userId);
      if (matchedTenant) {
        await serviceClient
          .from("profiles")
          .update({
            full_name: extractedData.nama as string,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", matchedTenant.user_id);
      }
    }

    return successResponse({
      ocr_result_id: ocrResultId,
      ml_model_run_id: mlRunId,
      document_type: "ktp",
      status: requiresReview ? "requires_review" : "completed",
      confidence_score: confidence,
      requires_review: requiresReview,
      extracted_data: extractedData,
      processing_time_ms: processingTimeMs,
      tier: {
        name: tierCheck.tierName,
        usage: tierCheck.currentUsage + 1,
        limit: tierCheck.limit,
      },
    });
  } catch (error) {
    console.error("OCR KTP error:", error);
    const processingTimeMs = Date.now() - startTime;

    if (error instanceof AiGatewayError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse(
      `OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
});
