import { differenceInDays, parseISO } from 'date-fns';
import { Plan, ProrationResult } from '../types';

export const calculateProration = (
  oldPlan: Plan,
  newPlan: Plan,
  periodStart: string,
  periodEnd: string,
  changeDate: string
): ProrationResult => {
  const start = parseISO(periodStart);
  const end = parseISO(periodEnd);
  const change = parseISO(changeDate);

  // Total days in the billing period
  const totalDays = differenceInDays(end, start);
  
  // Days used on the old plan
  const daysUsed = differenceInDays(change, start);
  
  // Days remaining on the new plan
  const daysRemaining = differenceInDays(end, change);

  if (totalDays <= 0) {
    return {
      old_plan_credit: 0,
      new_plan_charge: 0,
      net_proration: 0,
      days_used: 0,
      days_remaining: 0,
      effective_date: changeDate,
    };
  }

  // Calculate unused amount from old plan (credit)
  // Formula: (Old Price / Total Days) * Days Remaining
  const unusedAmount = (oldPlan.amount / totalDays) * daysRemaining;

  // Calculate amount for new plan for remaining days (charge)
  // Formula: (New Price / Total Days) * Days Remaining
  const newPlanAmount = (newPlan.amount / totalDays) * daysRemaining;

  // Net proration: Charge - Credit
  // Positive means user owes money. Negative means user gets credit.
  const proration = newPlanAmount - unusedAmount;

  return {
    old_plan_credit: -unusedAmount, // Negative to represent credit
    new_plan_charge: newPlanAmount,
    net_proration: proration,
    days_used: daysUsed,
    days_remaining: daysRemaining,
    effective_date: changeDate,
  };
};
