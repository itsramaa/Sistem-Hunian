import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";
import type {
  DashboardSummary,
  DashboardAlerts,
  DpAlert,
  PaymentAlert,
} from "@/features/dashboard/types";
import type { Notification } from "@/features/notifications/types";

// Re-export dari notifications feature agar consumer existing tidak perlu diubah
export {
  NOTIFICATIONS_KEY,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearReadNotifications,
} from "@/features/notifications/hooks/useNotifications";

export type { DashboardSummary, DashboardAlerts, Notification, DpAlert, PaymentAlert };

export const DASHBOARD_KEY = "dashboard";

export function useDashboardSummary() {
  return useQuery({
    queryKey: [DASHBOARD_KEY, "summary"],
    queryFn: () => dashboardApi.getSummary(),
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: [DASHBOARD_KEY, "alerts"],
    queryFn: () => dashboardApi.getAlerts(),
  });
}
