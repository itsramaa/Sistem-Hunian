import { supabase } from "@/lib/integrations/supabase/client";
import { UpdateVerificationParams, VendorVerification } from "../types/vendor-verification";
import { VENDOR_VERIFICATION_TRANSITIONS, MERCHANT_VERIFICATION_TRANSITIONS, isValidTransition } from "@/shared/constants/state-machines";
import { logStatusChange } from "@/shared/utils/auditLog";

export const vendorVerificationService = {
  async fetchVerifications(): Promise<VendorVerification[]> {
    const { data, error } = await supabase
      .from('vendor_verifications')
      .select(`
        *,
        vendor:vendors (
          id,
          business_name,
          contact_email,
          user_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as VendorVerification[];
  },

  async updateVerification({ id, status, rejectionReason }: UpdateVerificationParams): Promise<void> {
    // Fetch current status for validation
    const { data: current, error: fetchErr } = await supabase
      .from('vendor_verifications')
      .select('status, vendor_id')
      .eq('id', id)
      .single();

    if (fetchErr || !current) throw fetchErr || new Error('Verification not found');

    const oldStatus = current.status || 'pending';
    if (!isValidTransition(VENDOR_VERIFICATION_TRANSITIONS, oldStatus, status)) {
      throw new Error(`Invalid vendor verification transition: ${oldStatus} → ${status}`);
    }

    const updateData: Record<string, unknown> = {
      status,
      reviewed_at: new Date().toISOString(),
    };

    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('vendor_verifications')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    await logStatusChange('vendor', id, oldStatus, status, rejectionReason);
  },

  async updateVendorStatusIfVerified(vendorId: string): Promise<void> {
    // Check if vendor has at least 2 verified documents
    const { data: verifications, error: fetchError } = await supabase
      .from('vendor_verifications')
      .select('status')
      .eq('vendor_id', vendorId);

    if (fetchError) throw fetchError;

    const verifiedCount = verifications?.filter(v => v.status === 'verified').length || 0;
    
    // If at least 2 documents are verified, update vendor status to verified
    if (verifiedCount >= 2) {
      // Fetch current vendor status for validation
      const { data: vendor, error: vendorErr } = await supabase
        .from('vendors')
        .select('verification_status')
        .eq('id', vendorId)
        .single();

      if (vendorErr || !vendor) throw vendorErr || new Error('Vendor not found');

      const oldStatus = vendor.verification_status || 'pending';
      if (!isValidTransition(MERCHANT_VERIFICATION_TRANSITIONS, oldStatus, 'verified')) {
        // Vendor already verified or in incompatible state — skip silently
        return;
      }

      const { error: updateError } = await supabase
        .from('vendors')
        .update({ verification_status: 'verified' })
        .eq('id', vendorId);
        
      if (updateError) throw updateError;

      await logStatusChange('vendor', vendorId, oldStatus, 'verified');
    }
  },

  async fetchVendorDocuments(vendorId: string) {
    if (!vendorId) return [];
    const { data, error } = await supabase
      .from('vendor_verifications')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
