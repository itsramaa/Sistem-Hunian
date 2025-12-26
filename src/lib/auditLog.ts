import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "suspend"
  | "reactivate"
  | "export"
  | "payout"
  | "disbursement"
  | "login"
  | "logout"
  | "config_change"
  | "bulk_approve"
  | "toggle_visibility"
  | "resolve"
  | "dismiss";

export type AuditEntityType =
  | "merchant"
  | "vendor"
  | "dispute"
  | "escrow"
  | "disbursement"
  | "referral"
  | "subscription_tier"
  | "platform_config"
  | "chatbot_knowledge"
  | "forum_post"
  | "forum_comment"
  | "forum_report"
  | "analytics"
  | "audit_log"
  | "user";

interface AuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  oldData?: object | null;
  newData?: object | null;
  metadata?: object;
  userId?: string | null;
}

/**
 * Insert an audit log entry for admin actions.
 * Captures user agent and current timestamp.
 */
export async function createAuditLog({
  action,
  entityType,
  entityId = null,
  oldData = null,
  newData = null,
  metadata = {},
  userId = null,
}: AuditLogParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user if not provided
    let adminId = userId;
    if (!adminId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      adminId = user?.id || null;
    }

    const { error } = await supabase.from("audit_logs").insert([
      {
        user_id: adminId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_data: oldData as never,
        new_data: newData as never,
        metadata: {
          ...(metadata as Record<string, unknown>),
          timestamp: new Date().toISOString(),
        } as never,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    ]);

    if (error) {
      console.error("Failed to create audit log:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Audit log error:", err);
    return { success: false, error: "Failed to create audit log" };
  }
}

/**
 * Log an export action (CSV/PDF export)
 */
export async function logExport(
  entityType: AuditEntityType,
  exportFormat: "csv" | "pdf",
  recordCount: number,
  filters?: object
): Promise<void> {
  await createAuditLog({
    action: "export",
    entityType,
    metadata: {
      format: exportFormat,
      record_count: recordCount,
      filters,
    },
  });
}

/**
 * Log a config change action
 */
export async function logConfigChange(
  configKey: string,
  oldValue: object,
  newValue: object
): Promise<void> {
  await createAuditLog({
    action: "config_change",
    entityType: "platform_config",
    entityId: configKey,
    oldData: oldValue,
    newData: newValue,
  });
}

/**
 * Log a payout/disbursement action
 */
export async function logPayout(
  entityType: "referral" | "disbursement",
  entityId: string,
  amount: number,
  recipientId: string
): Promise<void> {
  await createAuditLog({
    action: "payout",
    entityType,
    entityId,
    newData: {
      amount,
      recipient_id: recipientId,
      paid_at: new Date().toISOString(),
    },
  });
}

/**
 * Log a status change action
 */
export async function logStatusChange(
  entityType: AuditEntityType,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  reason?: string
): Promise<void> {
  const action: AuditAction =
    newStatus === "verified" || newStatus === "approved" || newStatus === "resolved"
      ? "approve"
      : newStatus === "rejected" || newStatus === "dismissed"
      ? "reject"
      : newStatus === "suspended"
      ? "suspend"
      : "update";

  await createAuditLog({
    action,
    entityType,
    entityId,
    oldData: { status: oldStatus },
    newData: { status: newStatus, reason },
  });
}
