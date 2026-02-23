import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format year to consistent string format (YYYY)
 * @param year - Numeric year value
 * @returns Formatted year string
 */
export const formatYear = (year: number): string => {
  if (year < 2020 || year > 2026) {
    console.warn(`Year ${year} is outside allowed range (2020-2026)`);
  }
  return year.toString().padStart(4, '0');
};
