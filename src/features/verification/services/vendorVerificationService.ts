import { supabase } from "@/lib/integrations/supabase/client";
import { UpdateVerificationParams, VendorVerification } from "../types/vendor-verification";

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
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ verification_status: 'verified' })
        .eq('id', vendorId);
        
      if (updateError) throw updateError;
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
