import { addDays, isBefore } from 'date-fns';
import { DunningAttempt, Subscription, SubscriptionStatus } from '../types';

const RETRY_SCHEDULE = [
  { days: 3, action: 'email_reminder_1' },
  { days: 7, action: 'email_reminder_2' },
  { days: 14, action: 'email_final_notice' },
  { days: 21, action: 'cancel_subscription' },
];

export const getNextRetryDate = (lastAttemptDate: string, attemptNumber: number): string | null => {
  if (attemptNumber >= RETRY_SCHEDULE.length) {
    return null;
  }
  const schedule = RETRY_SCHEDULE[attemptNumber];
  return addDays(new Date(lastAttemptDate), schedule.days).toISOString();
};

export const shouldRetryPayment = (dunningAttempt: DunningAttempt): boolean => {
  if (dunningAttempt.status !== 'pending' && dunningAttempt.status !== 'failed') {
    return false;
  }
  const now = new Date();
  const nextRetry = new Date(dunningAttempt.next_retry);
  return isBefore(nextRetry, now); // If next retry date is in the past, we should retry
};

export const getDunningAction = (attemptNumber: number): string => {
  if (attemptNumber >= RETRY_SCHEDULE.length) {
    return 'cancel_subscription';
  }
  return RETRY_SCHEDULE[attemptNumber].action;
};

export const updateSubscriptionStatusOnFailure = (
  subscription: Subscription,
  attemptNumber: number
): SubscriptionStatus => {
  if (attemptNumber >= RETRY_SCHEDULE.length) {
    return SubscriptionStatus.CANCELED;
  }
  return SubscriptionStatus.PAST_DUE;
};
