import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createServiceClient,
  createUserClient,
  authenticateUser,
  checkTierLimit,
  getMerchantId,
  callLovableAI,
  AiGatewayError,
  logModelRun,
  errorResponse,
  successResponse,
} from "../_shared/dss-utils.ts";

const TIER_LIMITS = {
  free: 0,
  basic: 0,
  starter: 5,
  professional: -1,
  enterprise: -1,
};

const SUGGESTION_TOOL = {
  type: "function",
  function: {
    name: "suggest_corrections",
    description: "Suggest corrections for OCR extracted data fields that may have errors or low confidence.",
    parameters: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", description: "The field name that needs correction" },
              current_value: { type: "string", description: "The current extracted value" },
              suggested_value: { type: "string", description: "The suggested corrected value" },
              reason: { type: "string", description: "Why this correction is suggested" },
              confidence: { type: "number", description: "Confidence in the suggestion 0-100" },
            },
            required: ["field", "current_value", "suggested_value", "reason", "confidence"],
            additionalProperties: false,
          },
        },
        overall_assessment: { type: "string", description: "Overall assessment of the OCR extraction quality and key issues found" },
      },
      required: ["suggestions", "overall_assessment"],
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
    const userClient = createUserClient(req);
    const user = await authenticateUser(userClient);
    const serviceClient = createServiceClient();
    const merchantId = await getMerchantId(serviceClient, user.id);

    await checkTierLimit(serviceClient, merchantId, "ml_ocr_correction", TIER_LIMITS);

    const { ocr_result_id } = await req.json();
    if (!ocr_result_id) {
      return errorResponse("ocr_result_id is required", 400);
    }

    // Fetch OCR result
    const { data: ocrResult, error: ocrError } = await serviceClient
      .from("ocr_results")
      .select("*")
      .eq("id", ocr_result_id)
      .single();

    if (ocrError || !ocrResult) {
      return errorResponse("OCR result not found", 404);
    }

    const extractedData = ocrResult.extracted_data as Record<string, unknown> | null;
    if (!extractedData) {
      return errorResponse("No extracted data found in OCR result", 400);
    }

    const fieldConfidences = (extractedData.field_confidences as Record<string, number>) || {};
    const rawText = (extractedData.raw_text as string) || "";
    const documentType = ocrResult.document_type || "unknown";

    // Build prompt
    const fieldsInfo = Object.entries(extractedData)
      .filter(([k]) => !["field_confidences", "confidence", "raw_text"].includes(k))
      .map(([k, v]) => {
        const conf = fieldConfidences[k];
        return `- ${k}: "${v}" ${conf !== undefined ? `(confidence: ${conf}%)` : ""}`;
      })
      .join("\n");

    const prompt = `Analyze the following OCR extraction results from a "${documentType}" document and suggest corrections for any fields that appear incorrect, inconsistent, or have low confidence scores.

Extracted fields:
${fieldsInfo}

${rawText ? `Raw OCR text for reference:\n${rawText}\n` : ""}

Focus on:
1. Fields with low confidence scores (below 80%)
2. Values that seem inconsistent with each other
3. Common OCR errors (misread characters, wrong formatting)
4. Fields where the value doesn't match expected patterns for "${documentType}" documents

Only suggest corrections when you have reasonable confidence the current value is wrong. Do not suggest changes for fields that look correct.`;

    const aiResponse = await callLovableAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are an expert document analysis AI specializing in Indonesian documents (KTP, business permits, receipts, compliance documents). Analyze OCR results and suggest corrections based on document patterns and context.",
        },
        { role: "user", content: prompt },
      ],
      tools: [SUGGESTION_TOOL],
      tool_choice: { type: "function", function: { name: "suggest_corrections" } },
    });

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    let result = { suggestions: [], overall_assessment: "Unable to analyze" };

    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse AI response");
      }
    }

    const processingTime = Date.now() - startTime;

    await logModelRun(serviceClient, {
      merchant_id: merchantId,
      model_type: "ml_ocr_correction",
      input_params: { ocr_result_id, document_type: documentType },
      output_result: result,
      confidence_score: result.suggestions.length > 0
        ? result.suggestions.reduce((sum: number, s: { confidence: number }) => sum + s.confidence, 0) / result.suggestions.length
        : 100,
      processing_time_ms: processingTime,
      status: "completed",
    });

    return successResponse(result);
  } catch (error) {
    console.error("ml-ocr-correction-suggest error:", error);
    if (error instanceof AiGatewayError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
});
