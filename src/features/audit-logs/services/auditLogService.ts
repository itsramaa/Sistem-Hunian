import { supabase } from "@/lib/integrations/supabase/client";
import { AuditLogFilters, AuditLogWithProfile } from "../types/audit-log";

export const auditLogService = {
  fetchLogs: async (filters: AuditLogFilters) => {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (filters.action && filters.action !== 'all') {
      query = query.eq('action', filters.action);
    }
    if (filters.entityType && filters.entityType !== 'all') {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters.dateRange?.from) {
      query = query.gte('created_at', filters.dateRange.from.toISOString());
    }
    if (filters.dateRange?.to) {
      query = query.lte('created_at', filters.dateRange.to.toISOString());
    }

    if (filters.page && filters.pageSize) {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;
      query = query.range(from, to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;
    
    return { data: data as AuditLogWithProfile[], count };
  },

  fetchProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email');
    if (error) throw error;
    return data;
  }
};
