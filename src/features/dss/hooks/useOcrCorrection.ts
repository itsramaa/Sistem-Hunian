import { useMutation } from "@tanstack/react-query";
import { fetchCorrectionSuggestions, CorrectionResult } from "../services/ocrCorrectionService";
import { toast } from "sonner";

export function useOcrCorrectionSuggestions() {
  return useMutation<CorrectionResult, Error, string>({
    mutationFn: fetchCorrectionSuggestions,
    onError: (error) => {
      toast.error(`Gagal mendapatkan saran: ${error.message}`);
    },
  });
}
