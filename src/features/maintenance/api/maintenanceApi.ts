import { apiClient } from "@/shared/lib/axios";
import {
  CreateMaintenancePayload,
  Maintenance,
  UpdateMaintenancePayload,
} from "../types";

export const maintenanceApi = {
  async list(page = 1, limit = 20, status?: string, property_id?: string, room_id?: string) {
    const params: Record<string, any> = { page, limit };
    if (status) params.status = status;
    if (property_id) params.property_id = property_id;
    if (room_id) params.room_id = room_id;
    const { data } = await apiClient.get<any>("/maintenances", { params });
    return { maintenances: data?.data ?? [], pagination: data?.pagination ?? null };
  },

  async getById(id: string): Promise<Maintenance> {
    const { data } = await apiClient.get<any>(`/maintenances/${id}`);
    return data?.data ?? data;
  },

  async create(payload: CreateMaintenancePayload): Promise<Maintenance> {
    const { data } = await apiClient.post<Maintenance>("/maintenances", payload);
    return data as Maintenance;
  },

  async update(id: string, payload: UpdateMaintenancePayload): Promise<Maintenance> {
    const { data } = await apiClient.put<Maintenance>(`/maintenances/${id}`, payload);
    return data as Maintenance;
  },

  async uploadFotoKerusakan(id: string, file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append("foto", file);
    const { data } = await apiClient.patch<any>(
      `/maintenances/${id}/upload-damage`, form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data?.data ?? data;
  },

  async uploadFotoPenanganan(id: string, file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append("foto", file);
    const { data } = await apiClient.patch<any>(
      `/maintenances/${id}/upload-repair`, form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data?.data ?? data;
  },

  async getLogs(id: string) {
    const { data } = await apiClient.get(`/maintenances/${id}/logs`);
    return data?.data ?? [];
  },
};
