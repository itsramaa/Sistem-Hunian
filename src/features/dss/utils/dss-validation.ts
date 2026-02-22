import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { createAuditLog } from "@/shared/utils/auditLog";
import {
  OCR_RESULT_TRANSITIONS,
  PAYMENT_VERIFICATION_TRANSITIONS,
  DSS_RECOMMENDATION_TRANSITIONS,
  isValidTransition,
} from "@/shared/constants/state-machines";

// ─── Zod Schemas for OCR Results ───────────────────────────────────────────

export const ktpExtractedDataSchema = z.object({
  nik: z.string().length(16).optional(),
  nama: z.string().min(1).max(200).optional(),
  tempat_lahir: z.string().max(100).optional(),
  tanggal_lahir: z.string().optional(),
  jenis_kelamin: z.enum(["LAKI-LAKI", "PEREMPUAN"]).optional(),
  alamat: z.string().max(500).optional(),
  rt_rw: z.string().max(20).optional(),
  kel_desa: z.string().max(100).optional(),
  kecamatan: z.string().max(100).optional(),
  agama: z.string().max(50).optional(),
  status_perkawinan: z.string().max(50).optional(),
  pekerjaan: z.string().max(100).optional(),
  kewarganegaraan: z.string().max(50).optional(),
});

export const paymentProofExtractedDataSchema = z.object({
  amount: z.number().positive().optional(),
  bank_name: z.string().max(100).optional(),
  sender_name: z.string().max(200).optional(),
  recipient_name: z.string().max(200).optional(),
  transfer_date: z.string().optional(),
  reference_number: z.string().max(100).optional(),
});

export const businessDocExtractedDataSchema = z.object({
  document_number: z.string().max(100).optional(),
  business_name: z.string().max(300).optional(),
  owner_name: z.string().max(200).optional(),
  business_type: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
});

export const maintenanceReceiptExtractedDataSchema = z.object({
  vendor_name: z.string().max(200).optional(),
  receipt_number: z.string().max(100).optional(),
  receipt_date: z.string().optional(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().optional(),
    unit_price: z.number().optional(),
    total: z.number().optional(),
  })).optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
});

// ─── Schema Map by Document Type ───────────────────────────────────────────

const schemaMap: Record<string, z.ZodSchema> = {
  ktp: ktpExtractedDataSchema,
  payment_proof: paymentProofExtractedDataSchema,
  nib: businessDocExtractedDataSchema,
  siup: businessDocExtractedDataSchema,
  akta_pendirian: businessDocExtractedDataSchema,
  npwp: businessDocExtractedDataSchema,
  maintenance_receipt: maintenanceReceiptExtractedDataSchema,
};

// ─── Validation Functions ──────────────────────────────────────────────────

export async function validateOcrExtractedData(
  documentType: string,
  extractedData: unknown,
  ocrResultId: string
): Promise<{ valid: boolean; errors?: z.ZodError }> {
  const schema = schemaMap[documentType];
  if (!schema) {
    await logValidation({
      entityType: "ocr_result",
      entityId: ocrResultId,
      validationType: "schema",
      result: "warning",
      details: { message: `No validation schema for document type: ${documentType}` },
    });
    return { valid: true };
  }

  const result = schema.safeParse(extractedData);
  
  await logValidation({
    entityType: "ocr_result",
    entityId: ocrResultId,
    validationType: "schema",
    result: result.success ? "passed" : "failed",
    details: result.success ? { fields: Object.keys(extractedData as object) } : { errors: result.error.issues },
  });

  return result.success ? { valid: true } : { valid: false, errors: result.error };
}

export async function validateDssStateTransition(
  entityType: "ocr_result" | "payment_verification" | "dss_recommendation",
  entityId: string,
  oldState: string,
  newState: string
): Promise<{ valid: boolean; reason?: string }> {
  const transitionMap: Record<string, Record<string, string[]>> = {
    ocr_result: OCR_RESULT_TRANSITIONS,
    payment_verification: PAYMENT_VERIFICATION_TRANSITIONS,
    dss_recommendation: DSS_RECOMMENDATION_TRANSITIONS,
  };

  const transitions = transitionMap[entityType];
  if (!transitions) {
    return { valid: false, reason: `Unknown entity type: ${entityType}` };
  }

  const valid = isValidTransition(transitions, oldState, newState);

  await logValidation({
    entityType,
    entityId,
    validationType: "state_transition",
    result: valid ? "passed" : "failed",
    details: { from: oldState, to: newState, allowed: transitions[oldState] || [] },
    oldState,
    newState,
  });

  if (!valid) {
    await createAuditLog({
      action: "update",
      entityType: entityType === "ocr_result" ? "payment" : "notification",
      entityId,
      oldData: { status: oldState },
      newData: { status: newState, rejected: true },
      metadata: { reason: "Invalid state transition", entityType },
    });
  }

  return valid ? { valid: true } : { valid: false, reason: `Cannot transition from '${oldState}' to '${newState}'` };
}

// ─── Validation Logging ────────────────────────────────────────────────────

async function logValidation(params: {
  entityType: string;
  entityId: string;
  validationType: string;
  result: string;
  details?: object;
  oldState?: string;
  newState?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("dss_validation_logs").insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      validation_type: params.validationType,
      validation_result: params.result,
      validation_details: (params.details || {}) as never,
      old_state: params.oldState || null,
      new_state: params.newState || null,
      performed_by: user?.id || null,
    });
  } catch (err) {
    console.error("Failed to log DSS validation:", err);
  }
}
