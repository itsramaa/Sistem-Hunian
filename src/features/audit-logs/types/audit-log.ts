export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  dateRange?: { from?: Date; to?: Date };
  page?: number;
  pageSize?: number;
}

export interface AuditLogWithProfile {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
