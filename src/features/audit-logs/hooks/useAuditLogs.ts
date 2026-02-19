import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "../services/auditLogService";
import { AuditLogFilters } from "../types/audit-log";

export function useAuditLogs(filters: AuditLogFilters, enabled: boolean = true) {
  const { data: logsData, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const { data, count } = await auditLogService.fetchLogs(filters);
      return { data, count };
    },
    enabled,
  });

  const { data: profilesMap } = useQuery({
    queryKey: ['profiles-map'],
    queryFn: async () => {
      const data = await auditLogService.fetchProfiles();
      const map = new Map<string, { full_name: string | null; email: string | null }>();
      (data || []).forEach(p => {
        map.set(p.user_id, { full_name: p.full_name, email: p.email });
      });
      return map;
    },
    enabled,
  });

  return {
    logsData,
    isLoading,
    error,
    refetch,
    profilesMap
  };
}
