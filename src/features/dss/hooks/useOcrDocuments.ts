import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOcrResults,
  fetchOcrResultById,
  updateOcrResult,
  type OcrResultFilters,
} from "../services/ocrDocumentService";

export function useOcrResults(merchantId: string | undefined, filters?: OcrResultFilters) {
  return useQuery({
    queryKey: ["ocr-results", merchantId, filters],
    queryFn: () => fetchOcrResults(merchantId!, filters),
    enabled: !!merchantId,
  });
}

export function useOcrResultDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["ocr-result", id],
    queryFn: () => fetchOcrResultById(id!),
    enabled: !!id,
  });
}

export function useUpdateOcrResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Parameters<typeof updateOcrResult>[1];
    }) => updateOcrResult(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ocr-results"] });
      queryClient.invalidateQueries({ queryKey: ["ocr-result"] });
    },
  });
}
