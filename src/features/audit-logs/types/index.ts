export interface AuditLogWithProfile {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: unknown;
  new_data: unknown;
  ip_address: string | null;
  user_agent: string | null;
  metadata: unknown;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
}

export interface AuditLogFilters {
  searchQuery?: string;
  action?: string;
  entityType?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  page?: number;
  pageSize?: number;
}
