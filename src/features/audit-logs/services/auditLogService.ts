import { AuditLogFilters, AuditLogWithProfile } from "../types/audit-log";

// TODO: Go endpoint not yet implemented for audit-logs domain
// All methods below are stubbed — was: supabase.from('audit_logs')...

export const auditLogService = {
  fetchLogs: async (_filters: AuditLogFilters): Promise<{ data: AuditLogWithProfile[]; count: number | null }> => {
    // TODO: Go endpoint not yet implemented — was: supabase.from('audit_logs').select(...)
    return { data: [], count: 0 };
  },

  fetchProfiles: async () => {
    // TODO: Go endpoint not yet implemented — was: supabase.from('profiles').select('user_id, full_name, email')
    return [];
  },
};
