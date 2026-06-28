import { apiClient } from "@/shared/lib/axios";

export const settingsApi = {
  async getUsers() {
    const { data } = await apiClient.get("/users");
    return data?.data ?? data ?? [];
  },

  async createUser(payload: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    await apiClient.post("/users", payload);
  },

  async deleteUser(id: string) {
    await apiClient.patch(`/users/${id}/deactivate`);
  },

  async updateUser(
    id: string,
    payload: { name?: string; email?: string; role?: string },
  ) {
    await apiClient.patch(`/users/${id}`, payload);
  },

  async getWaConfig() {
    const { data } = await apiClient.get("/settings/wa-config");
    return data;
  },

  async saveWaConfig(payload: {
    recipient_numbers: string[];
    notification_enabled: boolean;
    notif_payment?: boolean;
    notif_dp?: boolean;
    notif_maintenance?: boolean;
  }) {
    await apiClient.put("/settings/wa-config", payload);
  },
};
