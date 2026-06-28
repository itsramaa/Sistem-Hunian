import type { Notification } from "@/features/notifications/types";

export type { Notification };

export interface DashboardSummary {
  total_properties: number;
  total_rooms: number;
  rooms_available: number;
  rooms_occupied: number;
  rooms_dp_confirmation: number;
  property_summary: Array<{
    property_id: string;
    property_name: string;
    total_rooms: number;
    occupied: number;
    available: number;
    dp_confirmation: number;
  }>;
  maintenance_summary: {
    reported: number;
    in_progress: number;
    total_maintenance_cost: number;
  };
  viewer_request_summary?: {
    total: number;
    wa_failed: number;
  };
}

export interface DpAlert {
  confirmation_id: string;
  room_id: string;
  room_number: string;
  property_name: string;
  prospect_name: string;
  confirmation_deadline: string;
  remaining_days: number | null;
  type: "dp_reminder" | "dp_expired";
}

export interface PaymentAlert {
  room_id: string;
  room_number: string;
  property_name: string;
  tenant_name: string;
  period: string;
  type: "payment_due" | "payment_overdue";
}

export interface DashboardAlerts {
  dp_alerts: DpAlert[];
  payment_alerts: PaymentAlert[];
}
