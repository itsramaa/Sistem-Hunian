import { apiClient } from "@/shared/lib/axios";
import type { AuditFilters, RoomStatusLog } from "../types";

export async function getAuditRoomStatus(filters: AuditFilters) {
  const params: Record<string, any> = {
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.property_id) params.property_id = filters.property_id;
  if (filters.room_id) params.room_id = filters.room_id;
  if (filters.new_status) params.new_status = filters.new_status;
  if (filters.from_date) params.from_date = filters.from_date;
  if (filters.to_date) params.to_date = filters.to_date;
  if (filters.changed_by) params.changed_by = filters.changed_by;

  const { data } = await apiClient.get<any>("/audit/room-status", { params });
  return {
    logs: (data?.data ?? []) as RoomStatusLog[],
    pagination: data?.pagination ?? null,
  };
}

export async function exportAuditCsv(
  filters: Omit<AuditFilters, "page" | "limit">,
) {
  const params = new URLSearchParams();
  if (filters.property_id) params.set("property_id", filters.property_id);
  if (filters.room_id) params.set("room_id", filters.room_id);
  if (filters.new_status) params.set("new_status", filters.new_status);
  if (filters.from_date) params.set("from_date", filters.from_date);
  if (filters.to_date) params.set("to_date", filters.to_date);
  if (filters.changed_by) params.set("changed_by", filters.changed_by);

  const response = await apiClient.get(`/audit/room-status/export?${params}`, {
    responseType: "blob",
  });
  return response.data as Blob;
}

export async function getUsersList() {
  const { data } = await apiClient.get("/users");
  // /users returns {success, data: [...]} — axios interceptor unwraps to array directly
  return Array.isArray(data) ? data : (data?.data ?? []);
}
