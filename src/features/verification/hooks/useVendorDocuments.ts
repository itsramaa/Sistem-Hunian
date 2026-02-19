import { useQuery } from "@tanstack/react-query";
import { vendorVerificationService } from "../services/vendorVerificationService";

export function useVendorDocuments(vendorId?: string) {
  return useQuery({
    queryKey: ['vendor-documents', vendorId],
    queryFn: () => vendorVerificationService.fetchVendorDocuments(vendorId!),
    enabled: !!vendorId,
  });
}
