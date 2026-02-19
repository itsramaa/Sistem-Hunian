import { Plan } from '../types';

export const PLANS: Plan[] = [
  {
    id: 'plan_basic_monthly',
    name: 'Basic Monthly',
    description: 'Good for starters',
    amount: 100000,
    currency: 'IDR',
    interval: 'month',
    trial_days: 14,
    features: ['Up to 5 properties', 'Basic analytics'],
  },
  {
    id: 'plan_pro_monthly',
    name: 'Pro Monthly',
    description: 'For growing businesses',
    amount: 250000,
    currency: 'IDR',
    interval: 'month',
    trial_days: 0,
    features: ['Unlimited properties', 'Advanced analytics', 'Priority support'],
  },
  {
    id: 'plan_enterprise_annual',
    name: 'Enterprise Annual',
    description: 'For large organizations',
    amount: 5000000,
    currency: 'IDR',
    interval: 'year',
    trial_days: 0,
    features: ['All features', 'Dedicated account manager', 'SLA'],
  },
  {
    id: 'plan_usage_based',
    name: 'Pay As You Go',
    description: 'Pay only for what you use',
    amount: 1000, // Per unit
    currency: 'IDR',
    interval: 'month',
    trial_days: 0,
    pricing_model: 'usage',
    features: ['Usage billing', 'No monthly fee', 'Scale with you'],
  },
];
