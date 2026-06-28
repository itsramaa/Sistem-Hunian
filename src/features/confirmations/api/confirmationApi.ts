import { apiClient } from "@/shared/lib/axios";
import {
  ConfirmDPPayload,
  Confirmation,
  CreateConfirmationPayload,
  UpdateConfirmationPayload,
} from "../types";

export const confirmationApi = {
  async list(page = 1, limit = 20, status?: string, property_id?: string) {
    const params: Record<string, any> = { page, limit };
    if (status) params.status = status;
    if (property_id) params.property_id = property_id;
    const { data } = await apiClient.get<any>("/confirmations", { params });
    return {
      confirmations: data?.data ?? [],
      pagination: data?.pagination ?? null,
    };
  },

  async getById(id: string): Promise<Confirmation> {
    const { data } = await apiClient.get<any>(`/confirmations/${id}`);
    return data as Confirmation;
  },

  async create(payload: CreateConfirmationPayload): Promise<Confirmation> {
    const { data } = await apiClient.post<Confirmation>(
      "/confirmations",
      payload,
    );
    return data as Confirmation;
  },

  async confirmDP(id: string, payload: ConfirmDPPayload): Promise<void> {
    await apiClient.post(`/confirmations/${id}/confirm`, payload);
  },

  async expire(id: string): Promise<void> {
    await apiClient.post(`/confirmations/${id}/expire`);
  },

  async updateDeadline(
    id: string,
    payload: UpdateConfirmationPayload,
  ): Promise<void> {
    await apiClient.put(`/confirmations/${id}`, payload);
  },
};
