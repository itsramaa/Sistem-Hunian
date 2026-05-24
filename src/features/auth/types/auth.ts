export type AppRole = 'admin' | 'merchant' | 'tenant' | 'vendor';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: AppRole;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface MerchantProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: 'individual' | 'company';
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  merchant_code: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  created_at: string;
  updated_at: string;
  merchant_subscriptions?: {
    tier_id: string;
    status: string;
    disbursement_schedule: string | null;
    billing_day: number | null;
    subscription_tiers?: {
      name: string;
    };
  }[];
}

export interface VendorProfile {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  description: string | null;
  service_categories: string[] | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  rating: number | null;
  total_jobs: number | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  role: AppRole | null;
  roles: AppRole[];
  activeRole: AppRole | null;
  merchant: MerchantProfile | null;
  vendor: VendorProfile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  error: Error | null;
}
