import { supabase } from "@/lib/integrations/supabase/client";
import { logStatusChange } from "@/shared/utils/auditLog";
import { UpdateVendorStatusParams, Vendor, VendorFilters } from "../types/admin-vendor";

export const vendorService = {
  async fetchVendors({ page = 1, pageSize = 20, search = "" }: VendorFilters): Promise<{ vendors: Vendor[]; total: number }> {
    let query = supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`business_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw new Error(`Failed to load vendors: ${error.message}`);
    return { vendors: data as Vendor[], total: count || 0 };
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

  async updateVendorStatus({ id, status, reason }: UpdateVendorStatusParams, oldStatus: string): Promise<void> {
    const updateData: { verification_status: string; rejection_reason?: string | null } = {
      verification_status: status,
    };

    if (status === 'rejected' && reason) {
      updateData.rejection_reason = reason;
    } else if (status === 'verified') {
      updateData.rejection_reason = null;
    }

    const { error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // Log status change
    if (status !== oldStatus) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logStatusChange(
          'vendor',
          id,
          oldStatus,
          status,
          reason
        );
      }
    }
  },
};

