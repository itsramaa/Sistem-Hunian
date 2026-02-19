export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  service_categories: string[] | null;
  rating: number | null;
  total_jobs: number | null;
  verification_status: string;
  created_at: string;
}

export interface VendorFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface UpdateVendorStatusParams {
  id: string;
  status: string;
  reason?: string;
}
