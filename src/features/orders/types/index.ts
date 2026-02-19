export interface Vendor {
  id: string;
  business_name: string;
  rating: number;
  total_jobs: number;
  verification_status: string;
}

export interface OrderProduct {
  name: string;
  vendor_id: string;
}

export interface OrderVendor {
  business_name: string;
}

export interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'canceled';
  total_price: number;
  service_fee: number;
  vendor_id: string;
  user_id: string;
  product_id: string;
  products?: OrderProduct;
  vendors?: OrderVendor;
}

export interface OrderReview {
  id: string;
  order_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
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

export interface OrderFilters {
  search?: string;
  status?: string;
}
