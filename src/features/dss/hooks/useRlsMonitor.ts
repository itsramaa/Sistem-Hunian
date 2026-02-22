import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RlsAccessLog {
  id: string;
  table_name: string;
  operation: string;
  user_id: string | null;
  user_role: string | null;
  was_denied: boolean;
  policy_name: string | null;
  error_message: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface RlsMonitorStats {
  totalRequests: number;
  deniedRequests: number;
  denialRate: number;
  recentDenials: RlsAccessLog[];
  denialsByTable: Array<{ table: string; count: number }>;
  denialsByOperation: Array<{ operation: string; count: number }>;
  denialTimeline: Array<{ hour: string; count: number }>;
}

export function useRlsMonitor(days = 7) {
  return useQuery({
    queryKey: ["rls-monitor", days],
    queryFn: async (): Promise<RlsMonitorStats> => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [allRes, deniedRes] = await Promise.all([
        supabase
          .from("rls_access_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since.toISOString()),
        supabase
          .from("rls_access_logs")
          .select("*")
          .eq("was_denied", true)
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const totalRequests = allRes.count || 0;
      const deniedData = (deniedRes.data || []) as RlsAccessLog[];
      const deniedRequests = deniedData.length;
      const denialRate = totalRequests > 0 ? (deniedRequests / totalRequests) * 100 : 0;

      // Denials by table
      const tableMap = new Map<string, number>();
      deniedData.forEach((d) => {
        tableMap.set(d.table_name, (tableMap.get(d.table_name) || 0) + 1);
      });
      const denialsByTable = Array.from(tableMap.entries())
        .map(([table, count]) => ({ table, count }))
        .sort((a, b) => b.count - a.count);

      // Denials by operation
      const opMap = new Map<string, number>();
      deniedData.forEach((d) => {
        opMap.set(d.operation, (opMap.get(d.operation) || 0) + 1);
      });
      const denialsByOperation = Array.from(opMap.entries())
        .map(([operation, count]) => ({ operation, count }))
        .sort((a, b) => b.count - a.count);

      // Timeline (by hour for last 24h subset)
      const hourMap = new Map<string, number>();
      deniedData.forEach((d) => {
        const h = new Date(d.created_at);
        const key = `${h.getMonth() + 1}/${h.getDate()} ${h.getHours()}:00`;
        hourMap.set(key, (hourMap.get(key) || 0) + 1);
      });
      const denialTimeline = Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .slice(0, 48);

      return {
        totalRequests,
        deniedRequests,
        denialRate,
        recentDenials: deniedData.slice(0, 50),
        denialsByTable,
        denialsByOperation,
        denialTimeline,
      };
    },
    refetchInterval: 30_000,
  });
}
