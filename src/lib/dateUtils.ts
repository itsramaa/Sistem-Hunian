/**
 * Centralized date utility functions
 */
import { format, startOfMonth, endOfMonth, subMonths, addDays, differenceInDays, isAfter, isBefore, isToday, isPast, isFuture } from 'date-fns';

// Date range helpers
export const getMonthDateRange = (date: Date = new Date()) => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

export const getLastMonthDateRange = (date: Date = new Date()) => {
  const lastMonth = subMonths(date, 1);
  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
  };
};

export const getCurrentMonthDateRange = () => getMonthDateRange(new Date());
export const getPreviousMonthDateRange = () => getLastMonthDateRange(new Date());

// Next N days from today
export const getNextNDaysRange = (days: number) => {
  const today = new Date();
  return {
    start: today,
    end: addDays(today, days),
  };
};

// Last N days from today
export const getLastNDaysRange = (days: number) => {
  const today = new Date();
  return {
    start: addDays(today, -days),
    end: today,
  };
};

// Format date for display
export const formatDisplayDate = (date: string | Date, formatStr: string = 'dd MMM yyyy'): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, formatStr);
  } catch {
    return '-';
  }
};

// Format date for ISO (database queries)
export const formatISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Calculate days difference
export const getDaysDifference = (date1: Date, date2: Date): number => {
  return differenceInDays(date1, date2);
};

// Due date helpers
export const isDueSoon = (dueDate: string | Date, daysThreshold: number = 7): boolean => {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  const diff = getDaysDifference(due, today);
  return diff >= 0 && diff <= daysThreshold;
};

export const isOverdue = (dueDate: string | Date): boolean => {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return isPast(due) && !isToday(due);
};

export const getDaysUntilDue = (dueDate: string | Date): number => {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return getDaysDifference(due, new Date());
};

export const getDaysOverdue = (dueDate: string | Date): number => {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const diff = getDaysDifference(new Date(), due);
  return diff > 0 ? diff : 0;
};

// Re-export commonly used date-fns functions
export {
  format,
  isAfter,
  isBefore,
  isToday,
  isPast,
  isFuture,
  addDays,
  subMonths,
  startOfMonth,
  endOfMonth,
  differenceInDays,
};
