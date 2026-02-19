import { supabase } from "@/lib/integrations/supabase/client";
import { Dispute, DisputesResponse, ResolveDisputeParams } from "../types/disputes";
import { logStatusChange } from "@/shared/utils/auditLog";

export const disputesService = {
  fetchDisputes: async (page: number, pageSize: number): Promise<DisputesResponse> => {
    const { data, error, count } = await supabase
      .from('disputes')
      .select(`
        *,
        contract:contracts (
          id,
          unit:units (
            unit_number,
            property:properties (
              name
            )
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    
    if (error) throw error;
    return { disputes: data as Dispute[], total: count || 0 };
  },

  resolveDispute: async (params: ResolveDisputeParams, currentStatus: string): Promise<void> => {
    const { id, status, resolution, resolved_by } = params;

    const { error } = await supabase
      .from('disputes')
      .update({
        status,
        resolution,
        resolved_by,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) throw error;

    await logStatusChange('dispute', id, currentStatus, status, resolution);
  }
};
