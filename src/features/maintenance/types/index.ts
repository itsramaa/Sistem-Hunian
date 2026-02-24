import { Contract } from '@/features/contracts/types';

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  assigned_vendor_id: string | null;
  created_at: string;
  resolved_at: string | null;
  unit_id: string;
  tenant_user_id: string | null;
  merchant_id: string;
  sla_deadline: string | null;
  images: string[] | null;
  preferred_schedule: string | null;
  completion_notes?: string | null;
  
  // Relations (optional as they might not always be fetched)
  unit?: {
    unit_number: string;
    property?: {
      name: string;
      address: string;
      merchant_id?: string;
    };
    contracts?: Pick<Contract, 'status' | 'start_date' | 'end_date' | 'tenant_user_id'>[];
  };
  assigned_vendor?: {
    business_name: string;
    phone_number?: string;
  };
  tenant?: {
    full_name: string;
    phone_number?: string;
    email?: string;
  };
}

export interface MaintenanceReview {
  id: string;
  maintenance_request_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  vendor?: {
    business_name: string;
  };
}

export interface CreateMaintenanceRequestPayload {
  title: string;
  description: string;
  category: string;
  priority: string;
  unit_id: string;
  tenant_user_id: string;
  merchant_id: string;
  images?: string[] | null;
  preferred_schedule?: string | null;
}

export interface CreateMerchantMaintenancePayload {
  title: string;
  description: string;
  category: string;
  priority: string;
  unit_id: string;
  merchant_id: string;
}

export interface UpdateMaintenanceStatusPayload {
  id: string;
  status: string;
  notes?: string;
  assigned_vendor_id?: string;
  scheduled_date?: string;
  agreed_price?: number;
  merchant_id?: string;
}

export interface MaintenanceTimeline {
  id: string;
  maintenance_request_id: string;
  status: string;
  message: string;
  actor_id: string;
  actor_role: string;
  created_at: string;
}

export interface CreateMaintenanceTimelinePayload {
  maintenance_request_id: string;
  status: string;
  message: string;
  actor_id: string;
  actor_role: string;
}

