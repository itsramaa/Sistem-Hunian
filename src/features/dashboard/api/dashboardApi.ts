import { apiClient } from "@/shared/lib/axios";
import type {
  DashboardSummary,
  DashboardAlerts,
} from "../types";

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<any>("/dashboard");
    const result: DashboardSummary =
      data?.total_properties !== undefined ? data : data?.data;
    return result ?? null;
  },

  async getAlerts(): Promise<DashboardAlerts> {
    const { data } = await apiClient.get<any>("/dashboard/alerts");
    const result = data?.dp_alerts !== undefined ? data : data?.data;
    return result ?? { dp_alerts: [], payment_alerts: [] };
  },
};
