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
  professional: 50,
  enterprise: -1,
};

const PAYMENT_PROOF_TOOL = {
  type: "function",
  function: {
    name: "extract_payment_proof",
    description: "Extract structured data from a payment proof/transfer receipt image.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Transfer amount in IDR" },
        bank_name: { type: "string", description: "Bank name (sender's bank)" },
        sender_name: { type: "string", description: "Sender account name" },
        sender_account: { type: "string", description: "Sender account number" },
        recipient_name: { type: "string", description: "Recipient account name" },
        recipient_account: { type: "string", description: "Recipient account number" },
        recipient_bank: { type: "string", description: "Recipient bank name" },
        transfer_date: { type: "string", description: "Transfer date (YYYY-MM-DD)" },
        reference_number: { type: "string", description: "Transaction reference/receipt number" },
        notes: { type: "string", description: "Transfer notes/description" },
        confidence: { type: "number", description: "Overall confidence score 0-100" },
        field_confidences: {
          type: "object",
          additionalProperties: { type: "number" },
        },
      },
      required: ["amount", "confidence"],
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

    const tierCheck = await checkTierLimit(serviceClient, merchantId, "ocr-payment-proof", TIER_LIMITS);
    if (!tierCheck.allowed) return tierCheck.error!;

    const { document_path, invoice_id } = await req.json();
    if (!document_path) return errorResponse("Missing document_path", 400);

    const { base64, mimeType } = await downloadImageAsBase64(serviceClient, "verification-documents", document_path);

    const aiResult = await callLovableAI({
      systemPrompt:
        "You are an OCR specialist for Indonesian bank transfer receipts and payment proofs. Extract all visible payment details including amount, bank, sender, recipient, date, and reference number.",
      userContent: [
        { type: "text", text: "Extract all payment details from this transfer receipt image." },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      ],
      tools: [PAYMENT_PROOF_TOOL],
      toolChoice: { type: "function", function: { name: "extract_payment_proof" } },
    });

    const extractedData = aiResult.toolCallResult;
    const confidence = (extractedData.confidence as number) || 0;
    const requiresReview = confidence < 90;
    const processingTimeMs = Date.now() - startTime;

    const mlRunId = await logModelRun(serviceClient, {
      functionName: "ocr-payment-proof",
      merchantId,
      userId: auth.userId,
      inputSummary: `Payment proof: ${document_path}`,
      outputSummary: `Amount: Rp${extractedData.amount || 0}, Bank: ${extractedData.bank_name || "N/A"}`,
      confidenceScore: confidence,
      executionTimeMs: processingTimeMs,
      tokensUsed: aiResult.tokensUsed,
      metadata: { tier: tierCheck.tierName },
    });

    const ocrResultId = await createOcrResult(serviceClient, {
      userId: auth.userId,
      merchantId,
      documentType: "payment_proof",
      documentUrl: document_path,
      status: requiresReview ? "requires_review" : "completed",
      extractedData: extractedData as Record<string, unknown>,
      confidenceScore: confidence,
      requiresReview,
      mlModelRunId: mlRunId,
      processingTimeMs,
    });

    // Auto-match with invoices
    let matchedInvoice = null;
    let matchConfidence = 0;

    if (extractedData.amount) {
      const extractedAmount = extractedData.amount as number;
      const tolerance = 1000; // ± Rp 1,000

      // Query pending/overdue invoices for this merchant
      const { data: invoices } = await serviceClient
        .from("invoices")
        .select("id, amount, total_amount, due_date, invoice_number, tenant_user_id")
        .eq("merchant_id", merchantId)
        .in("status", ["sent", "pending", "overdue"])
        .gte("total_amount", extractedAmount - tolerance)
        .lte("total_amount", extractedAmount + tolerance);

      if (invoices && invoices.length > 0) {
        // If invoice_id provided, prioritize it
        if (invoice_id) {
          matchedInvoice = invoices.find((i) => i.id === invoice_id) || invoices[0];
        } else {
          // Pick closest amount match
          matchedInvoice = invoices.reduce((best, inv) => {
            const diff = Math.abs(Number(inv.total_amount) - extractedAmount);
            const bestDiff = Math.abs(Number(best.total_amount) - extractedAmount);
            return diff < bestDiff ? inv : best;
          });
        }

        const amountDiff = Math.abs(Number(matchedInvoice.total_amount) - extractedAmount);
        matchConfidence = amountDiff === 0 ? 95 : amountDiff <= 500 ? 85 : 70;
      }
    }

    // Create payment verification record
    let verificationId = null;
    if (matchedInvoice || invoice_id) {
      const { data: verification } = await serviceClient
        .from("payment_verifications")
        .insert({
          ocr_result_id: ocrResultId,
          invoice_id: matchedInvoice?.id || invoice_id,
          merchant_id: merchantId,
          tenant_user_id: matchedInvoice?.tenant_user_id || auth.userId,
          status: matchConfidence >= 90 ? "auto_matched" : "pending",
          matched_amount: matchedInvoice ? Number(matchedInvoice.total_amount) : null,
          declared_amount: extractedData.amount as number,
          amount_difference: matchedInvoice
            ? Math.abs(Number(matchedInvoice.total_amount) - (extractedData.amount as number))
            : null,
          match_confidence: matchConfidence,
          bank_name: extractedData.bank_name as string,
          sender_name: extractedData.sender_name as string,
          recipient_name: extractedData.recipient_name as string,
          transfer_date: extractedData.transfer_date as string,
          reference_number: extractedData.reference_number as string,
        })
        .select("id")
        .single();

      verificationId = verification?.id;
    }

    return successResponse({
      ocr_result_id: ocrResultId,
      ml_model_run_id: mlRunId,
      verification_id: verificationId,
      document_type: "payment_proof",
      status: requiresReview ? "requires_review" : "completed",
      confidence_score: confidence,
      requires_review: requiresReview,
      extracted_data: extractedData,
      matched_invoice: matchedInvoice
        ? {
            invoice_id: matchedInvoice.id,
            invoice_number: matchedInvoice.invoice_number,
            amount: matchedInvoice.total_amount,
            match_confidence: matchConfidence,
          }
        : null,
      processing_time_ms: processingTimeMs,
      tier: { name: tierCheck.tierName, usage: tierCheck.currentUsage + 1, limit: tierCheck.limit },
    });
  } catch (error) {
    console.error("OCR Payment Proof error:", error);
    if (error instanceof AiGatewayError) return errorResponse(error.message, error.status);
    return errorResponse(`OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`, 500);
  }
});
