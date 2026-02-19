import { addDays, addMonths, addWeeks, addYears, startOfDay } from 'date-fns';
import { BillingInterval } from '../types';

export const calculateNextBillingDate = (
  currentPeriodStart: Date | string,
  interval: BillingInterval
): Date => {
  const startDate = new Date(currentPeriodStart);
  
  switch (interval) {
    case 'month':
      return addMonths(startDate, 1);
    case 'year':
      return addYears(startDate, 1);
    case 'week':
      return addWeeks(startDate, 1);
    case 'day':
      return addDays(startDate, 1);
    default:
      return addMonths(startDate, 1);
  }
};

export const isBillingDue = (currentPeriodEnd: Date | string): boolean => {
  const endDate = new Date(currentPeriodEnd);
  const now = new Date();
  return now >= endDate;
};

export const getBillingCycleDays = (start: Date | string, end: Date | string): number => {
  const startDate = startOfDay(new Date(start));
  const endDate = startOfDay(new Date(end));
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};
