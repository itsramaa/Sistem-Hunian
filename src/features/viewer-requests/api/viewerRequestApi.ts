import { apiClient } from "@/shared/lib/axios";
import type {
  ViewerRequestPayload,
  ViewerRequest,
  ViewerRequestListResponse,
} from "../types";

export type { ViewerRequestPayload, ViewerRequest, ViewerRequestListResponse };

export const viewerRequestApi = {
  create: async (
    payload: ViewerRequestPayload,
  ): Promise<{ success: boolean; status?: string }> => {
    const res = await apiClient.post("/viewer-requests", payload);
    return res.data;
  },

  list: async (page: number = 1, status?: string): Promise<ViewerRequestListResponse> => {
    const res = await apiClient.get("/viewer-requests", {
      params: { page, limit: 20, ...(status ? { status } : {}) },
    });
    return res.data;
  },
};
