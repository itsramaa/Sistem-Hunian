import { apiClient } from "@/lib/axios";
import { Dispute, DisputesResponse, ResolveDisputeParams } from "../types/disputes";
import { logStatusChange } from "@/shared/utils/auditLog";
import { DISPUTE_STATUS_TRANSITIONS, isValidTransition } from "@/shared/constants/state-machines";

export const disputesService = {
  fetchDisputes: async (page: number, pageSize: number): Promise<DisputesResponse> => {
    const response = await apiClient.get('/disputes', {
      params: {
        order: 'created_at.desc',
        offset: (page - 1) * pageSize,
        limit: pageSize,
      },
    });

    const data: Dispute[] = response.data?.data || response.data || [];
    const total: number = response.data?.count ?? data.length;
    return { disputes: data, total };
  },

  resolveDispute: async (params: ResolveDisputeParams, currentStatus: string): Promise<void> => {
    const { id, status, resolution, resolved_by } = params;

    if (!isValidTransition(DISPUTE_STATUS_TRANSITIONS, currentStatus, status)) {
      throw new Error(`Invalid dispute transition: ${currentStatus} → ${status}`);
    }

    await apiClient.put(`/disputes/${id}`, {
      status,
      resolution,
      resolved_by,
      resolved_at: new Date().toISOString(),
    });

    await logStatusChange('dispute', id, currentStatus, status, resolution);
  },
};
