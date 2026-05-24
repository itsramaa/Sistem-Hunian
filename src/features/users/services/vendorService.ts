import { apiClient } from "@/lib/axios";
import { logStatusChange } from "@/shared/utils/auditLog";
import { MERCHANT_VERIFICATION_TRANSITIONS, isValidTransition } from "@/shared/constants/state-machines";
import { UpdateVendorStatusParams, Vendor, VendorFilters } from "../types/admin-vendor";

export const vendorService = {
  async fetchVendors({ page = 1, pageSize = 20, search = "" }: VendorFilters): Promise<{ vendors: Vendor[]; total: number }> {
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
        order_by: 'created_at',
        order: 'desc',
      };
      if (search) params.search = search;

      const r = await apiClient.get('/vendors', { params });
      return { vendors: r.data?.data as Vendor[] ?? [], total: r.data?.total ?? 0 };
    } catch (err) {
      throw new Error(`Failed to load vendors: ${(err as Error).message}`);
    }
  },

  async fetchVendorDocuments(vendorId: string) {
    if (!vendorId) return [];
    try {
      const r = await apiClient.get('/vendor-verifications', {
        params: { vendor_id: vendorId, order_by: 'created_at', order: 'desc' },
      });
      return r.data ?? [];
    } catch (err) {
      throw err;
    }
  },

  async updateVendorStatus({ id, status, reason }: UpdateVendorStatusParams, oldStatus: string): Promise<void> {
    // Validate state transition
    if (!isValidTransition(MERCHANT_VERIFICATION_TRANSITIONS, oldStatus, status)) {
      throw new Error(`Invalid vendor status transition: ${oldStatus} → ${status}`);
    }

    const updateData: { verification_status: string; rejection_reason?: string | null } = {
      verification_status: status,
    };

    if (status === 'rejected' && reason) {
      updateData.rejection_reason = reason;
    } else if (status === 'verified') {
      updateData.rejection_reason = null;
    }

    try {
      await apiClient.put(`/vendors/${id}`, updateData);
    } catch (err) {
      throw err;
    }

    // Log status change
    if (status !== oldStatus) {
      await logStatusChange('vendor', id, oldStatus, status, reason);
    }
  },
};
