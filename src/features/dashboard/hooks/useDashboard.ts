import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";
import type {
  DashboardSummary,
  DashboardAlerts,
  Notification,
  DpAlert,
  PaymentAlert,
} from "@/features/dashboard/types";

export type { DashboardSummary, DashboardAlerts, Notification, DpAlert, PaymentAlert };

export const DASHBOARD_KEY = "dashboard";
export const NOTIFICATIONS_KEY = "notifications";

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

export function useNotifications(isRead?: boolean) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, { is_read: isRead }],
    queryFn: () => dashboardApi.getNotifications(isRead),
    refetchInterval: 60000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dashboardApi.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  });
}

export function useClearReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dashboardApi.clearReadNotifications(),
    onSuccess: () => qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dashboardApi.markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  });
}
