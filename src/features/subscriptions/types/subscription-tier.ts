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
  trial_days: number | null;
  sort_order: number;
}

export type SubscriptionTierInput = Omit<SubscriptionTier, 'id' | 'sort_order' | 'created_at' | 'updated_at'> & {
  sort_order?: number;
};
