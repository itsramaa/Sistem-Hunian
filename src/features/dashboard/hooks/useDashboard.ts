import { apiClient } from "@/shared/lib/axios";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PropertiSummaryItem {
  property_id: string;
  nama_properti: string;
  total_kamar: number;
  occupied: number;
  available: number;
  dp_confirmation: number;
}

export interface MaintenanceSummary {
  reported: number;
  in_progress: number;
}

export interface DashboardSummary {
  total_properti: number;

  total_kamar: number;

  kamar_available: number;

  kamar_occupied: number;

  kamar_dp_confirmation: number;

  properti_summary: PropertiSummaryItem[];

  maintenance_summary: MaintenanceSummary;
}

export interface DpAlert {
  confirmation_id: string;

  room_id: string;

  nomor_kamar: string;

  nama_properti: string;

  nama_calon_penghuni: string;

  batas_tanggal: string;

  sisa_hari: number;

  tipe: "dp_reminder" | "dp_expired";
}

export interface PaymentAlert {
  room_id: string;

  nomor_kamar: string;

  nama_properti: string;

  nama_penghuni: string;

  periode: string;

  tipe: "payment_due" | "payment_overdue";
}

export interface DashboardAlerts {
  dp_alerts: DpAlert[];

  payment_alerts: PaymentAlert[];
}

export interface Notification {
  id: string;

  tipe: "dp_reminder" | "dp_expired" | "payment_due" | "payment_overdue";

  referensi_id: string;

  pesan: string;

  is_read: boolean;

  created_at: string;
}

export const DASHBOARD_KEY = "dashboard";

export const NOTIFICATIONS_KEY = "notifications";

export function useDashboardSummary() {
  return useQuery({
    queryKey: [DASHBOARD_KEY, "summary"],
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/dashboard");
      // axios interceptor unwraps {success, data} → data langsung
      // tapi jika response masih punya .data nested, handle keduanya
      const result: DashboardSummary =
        data?.total_properti !== undefined ? data : data?.data;
      return result ?? null;
    },
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: [DASHBOARD_KEY, "alerts"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DashboardAlerts }>(
        "/dashboard/alerts",
      );
      return data.data;
    },
  });
}

export function useNotifications(isRead?: boolean) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, { is_read: isRead }],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Notification[] }>(
        "/notifications",
        {
          params: isRead !== undefined ? { is_read: isRead } : {},
        },
      );
      return data.data ?? [];
    },
    refetchInterval: 60000, // auto-refresh badge setiap 60 detik
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
}
