export interface MerchantFilters {
  status?: string;
  tier?: string;
  dateRange?: { from?: Date; to?: Date };
}

export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  address: string | null;
  city: string | null;
  province: string | null;
  verification_status: string;
  created_at: string;
  merchant_subscriptions?: {
    tier_id: string;
    status: string;
    subscription_tiers?: {
      name: string;
    };
  }[];

  verified_at: string | null;
  verified_by: string | null;
  rejected_at: string | null;
  profiles?: {
    email: string;
    full_name: string | null;
    phone: string | null;
  };
}

export interface Verification {
  id: string;
  merchant_id: string;
  document_type: string;
  document_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export interface HistoryEntry {
  id: string;
  merchant_id: string;
  action: string;
  performed_by: string | null;
  approval_notes: string | null;
  rejection_reason: string | null;
  rejection_details: string | null;
  resubmission_instructions: string | null;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
  performer?: {
    email: string;
    full_name: string | null;
  };
}

export interface MerchantAnalytics {
  totalRevenue: number;
  totalTenants: number;
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  activeContracts: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  onTimePaymentRate: number;
}

export interface MerchantProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  property_type: string;
  total_units: number | null;
  occupied_units: number | null;
  status: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  user_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}
