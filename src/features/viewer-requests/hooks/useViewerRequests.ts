import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  viewerRequestApi,
  ViewerRequestPayload,
} from "../api/viewerRequestApi";
import type { ViewerRequest } from "../types";

const VIEWER_REQUESTS_KEY = ["viewer-requests"];

export function useViewerRequests(page: number = 1) {
  return useQuery({
    queryKey: [...VIEWER_REQUESTS_KEY, page],
    queryFn: () => viewerRequestApi.list(page),
  });
}

export function useCreateViewerRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ViewerRequestPayload) =>
      viewerRequestApi.create(payload),
    onSuccess: () => {
      toast.success("Request berhasil dikirim ke operator");
      qc.invalidateQueries({ queryKey: VIEWER_REQUESTS_KEY });
    },
    onError: () => {
      toast.error("Gagal mengirim request");
    },
  });
}
