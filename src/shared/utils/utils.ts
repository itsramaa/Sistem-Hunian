import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "@/config/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const apiBase = env.API_URL; // 'http://localhost:9090/api/v1'
  if (path.startsWith("/r2/")) {
    return `${apiBase}${path}`;
  }
  if (path.startsWith("/uploads/")) {
    const host = apiBase.replace(/\/api\/v1$/, "");
    return `${host}${path}`;
  }
  return path;
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

/**
 * Format string label by removing underscores and converting to Title Case
 * Example: "high_banget" -> "High Banget"
 * @param label - The string label to format
 * @returns Formatted label string
 */
export function formatLabel(label: string | null | undefined): string {
  if (!label) return '-';
  
  return label
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
