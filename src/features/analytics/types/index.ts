export interface AnalyticsEvent {
  id: string;
  event_type: string;
  page: string | null;
  event_data: Record<string, unknown> | null;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
}

export interface PageViewData {
  page: string;
  views: number;
}

export interface EventTypeData {
  type: string;
  count: number;
  fill: string;
}

export interface HourlyData {
  hour: string;
  events: number;
}

export interface MerchantData {
  id: string;
  created_at: string;
  verification_status: string;
}

export interface PropertyData {
  id: string;
  created_at: string;
  status: string;
  property_type: string;
}

export interface UnitData {
  id: string;
  status: string;
  rent_amount: number;
}

export interface PaymentData {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  due_date: string;
}

export interface MaintenanceData {
  id: string;
  status: string;
  created_at: string;
}

export interface InvoiceData {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface ContractData {
  id: string;
  status: string;
  created_at: string;
  start_date: string;
  end_date: string;
  churn_reason: string | null;
  tenant_user_id: string;
  unit_id: string;
}

export interface StatsData {
  merchants: MerchantData[];
  properties: PropertyData[];
  units: UnitData[];
  payments: PaymentData[];
  maintenanceRequests: MaintenanceData[];
  invoices: InvoiceData[];
  contracts: ContractData[];
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  properties: number;
}

export interface TenantAnalyticsData {
  contracts: Pick<ContractData, 'id' | 'created_at' | 'status' | 'churn_reason' | 'unit_id' | 'end_date'>[];
  payments: Pick<PaymentData, 'id' | 'status' | 'due_date' | 'paid_at' | 'amount'>[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  activeTenants: number;
}

export interface DistributionStats {
  churnReasons: Record<string, number>;
  merchantStatus: Record<string, number>;
  unitStatus: Record<string, number>;
  maintenanceStatus: Record<string, number>;
}

export interface SubscriptionAnalyticsData {
  subscriptions: any[];
  tiers: any[];
}
