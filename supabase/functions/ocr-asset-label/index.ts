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
  basic: 5,
  professional: 30,
  enterprise: -1,
};

const ASSET_TOOL = {
  type: "function",
  function: {
    name: "extract_asset_data",
    description: "Extract structured data from an asset label, barcode, or nameplate image.",
    parameters: {
      type: "object",
      properties: {
        asset_name: { type: "string", description: "Name/type of the asset (e.g., Air Conditioner, TV, Refrigerator)" },
        brand: { type: "string", description: "Brand name" },
        model: { type: "string", description: "Model number" },
        serial_number: { type: "string", description: "Serial number" },
        barcode_data: { type: "string", description: "Barcode or QR code data if visible" },
        category: {
          type: "string",
          enum: ["electronics", "furniture", "appliance", "plumbing", "lighting", "other"],
          description: "Asset category",
        },
        specifications: { type: "string", description: "Any visible specifications (wattage, capacity, etc.)" },
        manufacture_date: { type: "string", description: "Manufacture date if visible" },
        condition_notes: { type: "string", description: "Visible condition observations" },
        confidence: { type: "number", description: "Overall confidence 0-100" },
        field_confidences: { type: "object", additionalProperties: { type: "number" } },
      },
      required: ["asset_name", "confidence"],
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

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ocr-asset-label", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const { document_path, unit_id } = await req.json();
    if (!document_path) return errorResponse("Missing document_path", 400);

    const { base64, mimeType } = await downloadImageAsBase64(serviceClient, "maintenance-photos", document_path);

    const aiResult = await callLovableAI({
      systemPrompt:
        "You are an OCR specialist for asset labels, nameplates, barcodes, and equipment tags. Extract brand, model, serial number, and any other visible data from the image. Categorize the asset type.",
      userContent: [
        { type: "text", text: "Extract all data from this asset label/nameplate/barcode image." },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
      tools: [ASSET_TOOL],
      toolChoice: { type: "function", function: { name: "extract_asset_data" } },
    });

    const extractedData = aiResult.toolCallResult;
    const confidence = (extractedData.confidence as number) || 0;
    const requiresReview = confidence < 80;
    const processingTimeMs = Date.now() - startTime;

    const mlRunId = await logModelRun(serviceClient, {
      functionName: "ocr-asset-label",
      merchantId,
      userId: auth.userId,
      inputSummary: `Asset label: ${document_path}`,
      outputSummary: `Asset: ${extractedData.asset_name || "N/A"}, Brand: ${extractedData.brand || "N/A"}`,
      confidenceScore: confidence,
      executionTimeMs: processingTimeMs,
      tokensUsed: aiResult.tokensUsed,
    });

    const ocrResultId = await createOcrResult(serviceClient, {
      userId: auth.userId,
      merchantId,
      documentType: "asset_label",
      documentUrl: document_path,
      status: requiresReview ? "requires_review" : "completed",
      extractedData: extractedData as Record<string, unknown>,
      confidenceScore: confidence,
      requiresReview,
      mlModelRunId: mlRunId,
      processingTimeMs,
    });

    // Auto-create asset record if unit_id provided and confidence >= 80
    let assetId: string | null = null;
    if (unit_id && !requiresReview) {
      const { data: asset } = await serviceClient
        .from("unit_assets")
        .insert({
          unit_id,
          merchant_id: merchantId,
          asset_name: extractedData.asset_name as string,
          brand: (extractedData.brand as string) || null,
          model: (extractedData.model as string) || null,
          serial_number: (extractedData.serial_number as string) || null,
          barcode_data: (extractedData.barcode_data as string) || null,
          category: (extractedData.category as string) || "other",
          condition: "good",
        })
        .select("id")
        .single();

      assetId = asset?.id || null;
    }

    return successResponse({
      ocr_result_id: ocrResultId,
      ml_model_run_id: mlRunId,
      asset_id: assetId,
      document_type: "asset_label",
      status: requiresReview ? "requires_review" : "completed",
      confidence_score: confidence,
      requires_review: requiresReview,
      extracted_data: extractedData,
      processing_time_ms: processingTimeMs,
      tier: { name: tierCheck.tierName, usage: tierCheck.currentUsage + 1, limit: tierCheck.limit },
    });
  } catch (error) {
    console.error("OCR Asset Label error:", error);
    if (error instanceof AiGatewayError) return errorResponse(error.message, error.status);
    return errorResponse(`OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`, 500);
  }
});
