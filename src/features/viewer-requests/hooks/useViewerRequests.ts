import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { viewerRequestService, ViewerRequestPayload } from "../api/viewerRequestService";

const VIEWER_REQUESTS_KEY = ["viewer-requests"];

export function useViewerRequests(page: number = 1) {
  return useQuery({
    queryKey: [...VIEWER_REQUESTS_KEY, page],
    queryFn: () => viewerRequestService.list(page),
  });
}

export function useCreateViewerRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ViewerRequestPayload) => viewerRequestService.create(payload),
    onSuccess: () => {
      toast.success("Request berhasil dikirim ke operator");
      qc.invalidateQueries({ queryKey: VIEWER_REQUESTS_KEY });
    },
    onError: () => {
      toast.error("Gagal mengirim request");
    },
  });
}
