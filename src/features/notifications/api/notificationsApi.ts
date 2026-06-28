import { apiClient } from "@/shared/lib/axios";
import type { Notification } from "../types";

export const notificationsApi = {
  async list(isRead?: boolean): Promise<Notification[]> {
    const { data } = await apiClient.get<{ data: Notification[] }>(
      "/notifications",
      { params: isRead !== undefined ? { is_read: isRead } : {} },
    );
    return data.data ?? [];
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  },

  async clearRead(): Promise<void> {
    await apiClient.delete("/notifications/read");
  },
};
