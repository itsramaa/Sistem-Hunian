/**
 * Centralized currency formatting utilities
 */

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

export const parseCurrency = (value: string): number => {
  // Remove currency symbol, thousands separators, and spaces
  const cleaned = value.replace(/[Rp.\s]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};
