import { apiClient } from '@/lib/axios';
import {
  CreateWaitinglistRequest,
  ListWaitinglistResponse,
  Waitinglist,
} from '@/features/waitinglist/types/waitinglist';

export const waitinglistApi = {
  async createWaitinglist(data: CreateWaitinglistRequest): Promise<Waitinglist> {
    const response = await apiClient.post<Waitinglist>('/waitinglist', data);
    return response.data;
  },

  async listWaitinglist(propertyId?: string): Promise<ListWaitinglistResponse> {
    const params: Record<string, string> = {};
    if (propertyId) {
      params.property_id = propertyId;
    }
    const response = await apiClient.get<ListWaitinglistResponse>('/waitinglist', { params });
    return response.data;
  },

  async deleteWaitinglist(id: string): Promise<void> {
    await apiClient.delete(`/waitinglist/${id}`);
  },
};
