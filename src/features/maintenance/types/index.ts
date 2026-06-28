// Maintenance — sesuai schema DB & Class Diagram
export type MaintenanceStatus = 'reported' | 'in_progress' | 'completed';

export interface Maintenance {
  id: string;
  room_id: string;
  // joined fields dari backend
  room_number?: string;
  property_name?: string;
  report_date: string;
  damage_description: string;
  repair_action?: string | null;
  cost?: number | null;
  damage_photo_url?: string | null;
  repair_photo_url?: string | null;
  status: MaintenanceStatus;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenancePayload {
  property_id: string;
  room_id: string;
  report_date: string;
  damage_description: string;
}

export interface UpdateMaintenancePayload {
  repair_action?: string;
  cost?: number;
  status: MaintenanceStatus;
}

export interface MaintenanceLog {
  id: string;
  maintenance_id: string;
  status: MaintenanceStatus;
  notes: string | null;
  updated_by: string | null;
  updated_by_name?: string | null;
  created_at: string;
}
