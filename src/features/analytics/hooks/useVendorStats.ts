import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "../services/analyticsService";

export function useVendorStats() {
  return useQuery({
    queryKey: ['admin-vendor-stats'],
    queryFn: () => analyticsService.fetchVendorStats(),
  });
}
