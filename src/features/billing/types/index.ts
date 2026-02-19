export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  PAUSED = 'paused',
}

export type BillingInterval = 'month' | 'year' | 'week' | 'day';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  trial_days?: number;
  features?: string[];
  pricing_model?: 'flat' | 'per_seat' | 'usage' | 'tiered';
  tiers?: PricingTier[];
}

export interface PricingTier {
  up_to: number | 'inf';
  unit_price: number;
  flat_fee?: number;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  current_period_start: string; // ISO Date
  current_period_end: string; // ISO Date
  billing_cycle_anchor: string; // ISO Date
  cancel_at_period_end: boolean;
  canceled_at?: string; // ISO Date
  trial_start?: string; // ISO Date
  trial_end?: string; // ISO Date
  quantity?: number; // For per-seat pricing
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  customer_id: string;
  subscription_id?: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  currency: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  subtotal: number;
  tax: number;
  total: number;
  line_items: InvoiceLineItem[];
  created_at: string; // ISO Date
  due_date: string; // ISO Date
  paid_at?: string; // ISO Date
  pdf_url?: string;
  hosted_invoice_url?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_amount: number;
  amount: number;
  currency: string;
  period?: {
    start: string;
    end: string;
  };
}

export interface TaxInfo {
  tax_amount: number;
  tax_rate: number;
  jurisdiction: string;
  tax_type: string;
  inclusive: boolean;
}

export interface ProrationResult {
  old_plan_credit: number;
  new_plan_charge: number;
  net_proration: number;
  days_used: number;
  days_remaining: number;
  effective_date: string; // ISO Date
}

export interface DunningAttempt {
  id: string;
  subscription_id: string;
  invoice_id: string;
  attempt_number: number;
  next_retry: string; // ISO Date
  status: 'pending' | 'failed' | 'resolved';
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  tax_id?: {
    type: string;
    value: string;
  };
}

export interface UsageRecord {
  id: string;
  subscription_id: string;
  quantity: number;
  timestamp: string; // ISO Date
  action: 'increment' | 'set';
}
