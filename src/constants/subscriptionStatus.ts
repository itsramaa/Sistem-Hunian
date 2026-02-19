/**
 * Subscription status constants and utilities
 * Centralized to avoid inconsistencies across the codebase
 */

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Grace period in days
export const GRACE_PERIOD_DAYS = 7;

// Trial period in days
export const TRIAL_PERIOD_DAYS = 14;

// Minimum subscription period before cancellation (days)
export const MIN_SUBSCRIPTION_PERIOD_DAYS = 30;

// Check if subscription is in good standing
export const isSubscriptionActive = (status: string | null | undefined): boolean => {
  return status === SUBSCRIPTION_STATUS.ACTIVE || status === SUBSCRIPTION_STATUS.TRIALING;
};

// Check if subscription is past due but still in grace period
export const isInGracePeriod = (
  status: string | null | undefined,
  gracePeriodEnd: string | null | undefined
): boolean => {
  if (status !== SUBSCRIPTION_STATUS.PAST_DUE) return false;
  if (!gracePeriodEnd) return false;
  return new Date(gracePeriodEnd) > new Date();
};

// Get display text for subscription status
export const getSubscriptionStatusText = (status: string | null | undefined): string => {
  switch (status) {
    case SUBSCRIPTION_STATUS.ACTIVE:
      return 'Active';
    case SUBSCRIPTION_STATUS.TRIALING:
      return 'Trial';
    case SUBSCRIPTION_STATUS.PAST_DUE:
      return 'Past Due';
    case SUBSCRIPTION_STATUS.CANCELED:
      return 'Canceled';
    case SUBSCRIPTION_STATUS.SUSPENDED:
      return 'Suspended';
    case SUBSCRIPTION_STATUS.PENDING:
      return 'Pending';
    default:
      return 'Unknown';
  }
};

// Get badge variant for subscription status
export const getSubscriptionStatusVariant = (
  status: string | null | undefined
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case SUBSCRIPTION_STATUS.ACTIVE:
      return 'outline';
    case SUBSCRIPTION_STATUS.TRIALING:
      return 'secondary';
    case SUBSCRIPTION_STATUS.PAST_DUE:
    case SUBSCRIPTION_STATUS.SUSPENDED:
      return 'destructive';
    case SUBSCRIPTION_STATUS.CANCELED:
      return 'destructive';
    default:
      return 'secondary';
  }
};
