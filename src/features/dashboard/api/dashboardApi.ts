import { apiClient } from "@/shared/lib/axios";
import type {
  DashboardSummary,
  DashboardAlerts,
  Notification,
} from "../types";

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<any>("/dashboard");
    const result: DashboardSummary =
      data?.total_properti !== undefined ? data : data?.data;
    return result ?? null;
  },

  async getAlerts(): Promise<DashboardAlerts> {
    const { data } = await apiClient.get<any>("/dashboard/alerts");
    const result = data?.dp_alerts !== undefined ? data : data?.data;
    return result ?? { dp_alerts: [], payment_alerts: [] };
  },

  async getNotifications(isRead?: boolean): Promise<Notification[]> {
    const { data } = await apiClient.get<{ data: Notification[] }>(
      "/notifications",
      {
        params: isRead !== undefined ? { is_read: isRead } : {},
      },
    );
    return data.data ?? [];
  },

  async markNotificationRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllNotificationsRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  },

  async clearReadNotifications(): Promise<void> {
    await apiClient.delete("/notifications/read");
  },
};
