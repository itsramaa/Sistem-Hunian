import { apiClient } from "@/lib/axios";
import { UpdateVerificationParams, VendorVerification } from "../types/vendor-verification";
import { VENDOR_VERIFICATION_TRANSITIONS, MERCHANT_VERIFICATION_TRANSITIONS, isValidTransition } from "@/shared/constants/state-machines";
import { logStatusChange } from "@/shared/utils/auditLog";

// TODO: Go endpoint not yet implemented for vendor-verification domain
// All methods below are stubbed — was: supabase.from('vendor_verifications')...

export const vendorVerificationService = {
  async fetchVerifications(): Promise<VendorVerification[]> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('vendor_verifications').select(...)
    return [];
  },

  async updateVerification({ id, status, rejectionReason }: UpdateVerificationParams): Promise<void> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('vendor_verifications').update(...)
    // Validate transition locally before stubbing
    const oldStatus = 'pending'; // stub — real status unknown without endpoint
    if (!isValidTransition(VENDOR_VERIFICATION_TRANSITIONS, oldStatus, status)) {
      throw new Error(`Invalid vendor verification transition: ${oldStatus} → ${status}`);
    }

    await logStatusChange('vendor', id, oldStatus, status, rejectionReason);
    throw new Error('Vendor verification update not yet available');
  },

  async updateVendorStatusIfVerified(_vendorId: string): Promise<void> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('vendor_verifications').select('status').eq('vendor_id', vendorId)
  },

  async fetchVendorDocuments(_vendorId: string) {
    // TODO: Go endpoint not yet implemented — was: supabase.from('vendor_verifications').select('*').eq('vendor_id', vendorId)
    return [];
  },
};
