export interface Order {
  id: string;
  order_number: string;
  product_id: string;
  vendor_id: string;
  tenant_user_id: string;
  unit_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  service_fee: number | null;
  status: string;
  notes: string | null;
  address: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  cancel_reason: string | null;
  canceled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  products?: { name: string; vendor_id: string } | null;
  vendors?: { business_name: string } | null;
}

export interface Vendor {
  id: string;
  business_name: string;
  rating: number | null;
  total_jobs: number | null;
  verification_status: string;
}

export interface OrderReview {
  id: string;
  order_id: string;
  vendor_id: string;
  tenant_user_id: string;
  rating: number;
  review_text: string | null;
  photos: string[] | null;
  is_visible: boolean | null;
  vendor_reply: string | null;
  vendor_replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  totalRevenue: number;
  totalServiceFees: number;
}

export interface MonthlyOrderStat {
  month: string;
  orders: number;
  revenue: number;
}

export interface VendorPerformance {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  rating: number;
}
