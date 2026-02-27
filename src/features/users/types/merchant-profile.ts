/**
 * Shared merchant types
 */

export interface MerchantProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  merchant_code: string | null;
  verification_status: string | null;
  min_disbursement_amount: number | null;
  penalty_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  merchant_id: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  type: string;
  total_units: number;
  occupied_units: number;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  floor: number | null;
  size_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  base_rent: number;
  status: 'available' | 'occupied' | 'maintenance';
  amenities: string[] | null;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  merchant_id: string;
  unit_id: string;
  tenant_user_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number | null;
  billing_day: number | null;
  status: 'pending' | 'active' | 'terminated' | 'expired' | 'cancelled';
  signature_status: string | null;
  terms: string | null;
  grace_period_days: number | null;
  late_payment_penalty_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  contract_id: string;
  merchant_id: string;
  tenant_user_id: string;
  amount: number;
  tax_amount: number | null;
  late_fee: number | null;
  total_amount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string | null;
  contract_id: string;
  merchant_id: string;
  tenant_user_id: string;
  amount: number;
  payment_method: string | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  due_date: string;
  paid_at: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequest {
  id: string;
  merchant_id: string;
  unit_id: string;
  tenant_user_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  assigned_vendor_id: string | null;
  sla_deadline: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface PaymentTransfer {
  id: string;
  payment_id: string;
  merchant_id: string;
  amount: number;
  platform_fee: number;
  gateway_fee: number;
  net_amount: number;
  bank_account_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  xendit_disbursement_id: string | null;
  external_reference: string | null;
  processed_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  max_properties: number;
  max_units: number;
  max_tenants: number;
  features: string[] | null;
  is_active: boolean;
  sort_order: number;
}

export interface MerchantSubscription {
  id: string;
  merchant_id: string;
  tier_id: string;
  tier?: SubscriptionTier;
  status: string;
  payment_status: string | null;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  grace_period_end: string | null;
  canceled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Dashboard types
export interface DashboardStats {
  occupancyRate: number;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  revenueChange: number;
  tenantChange: number;
  transferBalance: number;
  pendingBalance: number;
  activeTenants: number;
  lastMonthTenants: number;
  propertyCount: number;
}

export interface UpcomingPayment {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  tenant_user_id: string;
  tenantName: string;
  unitNumber: string;
}

export interface RecentPayment {
  id: string;
  amount: number;
  paid_at: string;
  status: string;
  tenant_user_id: string;
  tenantName: string;
  unitNumber: string;
}
