export interface SubscriptionMerchant {
  id: string;
  business_name: string;
  business_type?: string;
  created_at: string;
  merchant_subscriptions?: {
    id: string;
    status: string;
    tier_id: string;
    current_period_end: string;
    trial_ends_at?: string;
    subscription_tiers?: {
      name: string;
      display_name: string;
    };
  }[];
}

export interface SubscriptionInvoice {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
  merchants?: {
    business_name: string;
  };
  subscription_tiers?: {
    name: string;
    display_name: string;
  };
}

export interface CancellationFeedback {
  id: string;
  reason: string;
  feedback?: string;
  would_return?: boolean;
  created_at: string;
  merchants?: {
    business_name: string;
  };
}

export interface PendingSubscriptionChange {
  id: string;
  status: string;
  effective_date: string;
  change_type?: string;
  reason?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  requested_by?: string;
  merchants?: {
    business_name: string;
  };
  from_tier?: {
    name: string;
    display_name: string;
  };
  to_tier?: {
    name: string;
    display_name: string;
  };
}

export interface SubscriptionStats {
  enterprise: number;
  pro: number;
  basic: number;
  free: number;
  total: number;
  [key: string]: number;
}
