/**
 * Platform fee constants
 * Centralized to avoid inconsistencies across the codebase
 */

// Platform fee percentage for vendor services/products
export const VENDOR_PLATFORM_FEE_PERCENT = 0.05; // 5%

// Minimum payout amount
export const MINIMUM_PAYOUT_AMOUNT = 50000; // Rp 50,000

// Payout schedule
export const PAYOUT_SCHEDULE = 'weekly'; // 'weekly' | 'biweekly' | 'monthly'

// Helper to calculate fee
export const calculatePlatformFee = (amount: number): number => {
  return Math.round(amount * VENDOR_PLATFORM_FEE_PERCENT);
};

// Helper to calculate net amount after fee
export const calculateNetAmount = (amount: number): number => {
  return amount - calculatePlatformFee(amount);
};

// Format fee percentage for display
export const formatFeePercentage = (): string => {
  return `${(VENDOR_PLATFORM_FEE_PERCENT * 100).toFixed(0)}%`;
};
