import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeOcrCompliance } from "@/features/compliance/services/ocrComplianceService";
import { toast } from "sonner";

export function useOcrCompliance(propertyId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: invokeOcrCompliance,
    onSuccess: (data) => {
      if (data.auto_populated) {
        toast.success(`Dokumen ${data.detected_type} berhasil diextract dan disimpan otomatis`);
      } else {
        toast.info(`Dokumen diextract dengan confidence ${data.confidence_score}%. Perlu review manual.`);
      }
      if (propertyId) {
        qc.invalidateQueries({ queryKey: ["compliance-summary", propertyId] });
      }
    },
    onError: (err: Error) => {
      toast.error(`OCR gagal: ${err.message}`);
    },
  });
}
