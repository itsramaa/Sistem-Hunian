import { getApiErrorMessage } from "@/shared/utils/api-errors";

/**
 * Get auth error message — uses backend message directly to ensure consistency.
 * Priority: backend error message → error code lookup → network/HTTP fallback
 */
export function getAuthErrorMessage(error: Error | null | undefined): string {
  if (!error) return "Terjadi kesalahan. Silakan coba lagi.";

  // For AxiosError, the centralized handler will prioritize backend messages
  return getApiErrorMessage(error);
}
