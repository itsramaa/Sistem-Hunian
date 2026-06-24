import { apiClient } from "@/shared/lib/axios";

export const settingsApi = {
  async getUsers() {
    const { data } = await apiClient.get("/users");
    return data?.data ?? data ?? [];
  },

  async createUser(payload: {
    nama: string;
    email: string;
    password: string;
    role: string;
  }) {
    await apiClient.post("/users", payload);
  },

  async deleteUser(id: string) {
    await apiClient.delete(`/users/${id}`);
  },

  async getWaConfig() {
    const { data } = await apiClient.get("/settings/wa-config");
    return data;
  },

  async saveWaConfig(payload: {
    recipient_numbers: string[];
    notification_enabled: boolean;
  }) {
    await apiClient.put("/settings/wa-config", payload);
  },
};
