import { useQuery } from "@tanstack/react-query";
import { getAuditRoomStatus, exportAuditCsv, getUsersList } from "@/features/audit/api/auditApi";
import type { AuditFilters, RoomStatusLog } from "@/features/audit/types";

export type { AuditFilters, RoomStatusLog };
export { exportAuditCsv };

export const AUDIT_KEY = "audit-room-status";

export function useAuditRoomStatus(filters: AuditFilters) {
  return useQuery({
    queryKey: [AUDIT_KEY, filters],
    queryFn: () => getAuditRoomStatus(filters),
  });
}

export function useAuditUsersList() {
  return useQuery({
    queryKey: ["users-list"],
    queryFn: getUsersList,
  });
}
