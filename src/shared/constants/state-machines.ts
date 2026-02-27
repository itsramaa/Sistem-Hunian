/**
 * Centralized State Machine Constants — Single Source of Truth
 * 
 * Aligned 100% with docs/domain-state-machines.md v3.0
 * All transition maps define: { currentState: allowedNextStates[] }
 * Terminal states have empty arrays.
 * 
 * @see docs/domain-state-machines.md
 */

// ─── Section 2: Contract Lifecycle ─────────────────────────────────────────
export const CONTRACT_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'cancelled'],                     // active only via fully_signed
  pending_signature: ['active', 'cancelled'],          // legacy compat
  active: ['notice', 'terminated', 'expired'],
  notice: ['completed'],
  terminated: [],  // terminal
  expired: [],     // terminal
  completed: [],   // terminal
  cancelled: [],   // terminal
};

// Contract Signature Sub-States (signature_status column)
export const CONTRACT_SIGNATURE_TRANSITIONS: Record<string, string[]> = {
  pending: ['merchant_signed', 'tenant_signed'],
  merchant_signed: ['fully_signed'],
  tenant_signed: ['fully_signed'],
  fully_signed: [],  // terminal — triggers contract active + unit occupied
};

// ─── Section 3: Unit Status ────────────────────────────────────────────────
export const UNIT_STATUS_TRANSITIONS: Record<string, string[]> = {
  available: ['occupied', 'maintenance'],
  occupied: ['available', 'maintenance'],
  maintenance: ['available', 'occupied'],
};

// ─── Section 4: Invoice Lifecycle ──────────────────────────────────────────
export const INVOICE_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled', 'partially_paid'],
  overdue: ['paid', 'cancelled', 'escalated'],
  partially_paid: ['paid', 'cancelled'],
  pending: ['paid', 'overdue', 'cancelled'],           // legacy compat
  escalated: ['paid', 'cancelled'],  // collections-level overdue (15+ days)
  paid: [],       // terminal
  cancelled: [],  // terminal
};

// ─── Section 6: Payment Status ─────────────────────────────────────────────
export const PAYMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'overdue', 'failed'],
  overdue: ['paid'],
  paid: [],       // terminal
  cancelled: [],  // terminal
  failed: [],     // terminal
};

// ─── Section 7: Payment Plan Lifecycle ─────────────────────────────────────
export const PAYMENT_PLAN_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending_acceptance: ['accepted', 'cancelled'],
  accepted: ['active'],
  active: ['completed', 'defaulted'],
  completed: [],   // terminal
  defaulted: [],   // terminal
  cancelled: [],   // terminal
};

// ─── Section 8: Maintenance Request Lifecycle ──────────────────────────────
export const MAINTENANCE_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],   // terminal
  cancelled: [],   // terminal
};

// ─── Section 9: Merchant Subscription Lifecycle ────────────────────────────
export const SUBSCRIPTION_STATUS_TRANSITIONS: Record<string, string[]> = {
  trialing: ['active', 'cancelled'],
  active: ['past_due', 'cancelled'],
  past_due: ['active', 'suspended'],
  suspended: ['active', 'cancelled'],
  cancelled: [],   // terminal
};

// ─── Section 10.1: Move-Out Notice ─────────────────────────────────────────
export const MOVE_OUT_NOTICE_TRANSITIONS: Record<string, string[]> = {
  submitted: ['acknowledged', 'rejected'],
  acknowledged: ['approved'],
  approved: ['completed'],
  rejected: [],    // terminal
  completed: [],   // terminal
};

// ─── Section 10.2: Move-Out Inspection ─────────────────────────────────────
export const MOVE_OUT_INSPECTION_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['in_progress'],
  in_progress: ['completed'],
  completed: [],   // terminal
};

// ─── Section 10.3: Early Termination Request ───────────────────────────────
export const EARLY_TERMINATION_TRANSITIONS: Record<string, string[]> = {
  pending_approval: ['approved', 'denied', 'counter_offered'],
  counter_offered: ['approved', 'denied'],
  approved: [],    // terminal
  denied: [],      // terminal
};

// ─── Section 11: Order Lifecycle (Marketplace) ─────────────────────────────
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'canceled'],
  confirmed: ['in_progress', 'canceled'],
  in_progress: ['completed'],
  completed: [],   // terminal
  canceled: [],    // terminal (note: 'canceled' not 'cancelled' per docs)
};

// ─── Section 12: Vendor Job Lifecycle ──────────────────────────────────────
export const VENDOR_JOB_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],   // terminal
  rejected: [],    // terminal
  cancelled: [],   // terminal
};

// ─── Section 13: Payment Transfer Lifecycle (Direct Payment Model) ─────────
export const PAYMENT_TRANSFER_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing'],
  processing: ['completed', 'failed'],
  failed: ['pending'],    // retry
  completed: [],   // terminal
};

// ─── Section 13b: Vendor Disbursement Lifecycle ───────────────────────────
export const DISBURSEMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing'],
  processing: ['completed', 'failed'],
  failed: ['pending'],    // retry
  completed: [],   // terminal
};

// ─── Section 15: Referral Lifecycle ────────────────────────────────────────
export const REFERRAL_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['active', 'expired'],
  active: ['completed'],
  completed: [],   // terminal
  expired: [],     // terminal
};

// ─── Section 15.5: Verification Tier Upgrades ─────────────────────────────
export const VERIFICATION_TIER_TRANSITIONS: Record<string, string[]> = {
  quick: ['standard'],
  standard: ['premium'],
  premium: [],  // terminal
};

// ─── Section 16: Verification Workflows ────────────────────────────────────
export const VERIFICATION_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['approved', 'rejected'],
  rejected: ['pending'],
  approved: [],    // terminal
};

export const MERCHANT_VERIFICATION_TRANSITIONS: Record<string, string[]> = {
  pending: ['verified', 'rejected'],
  rejected: ['pending'],
  verified: ['suspended'],
  suspended: ['verified'],
};

export const VENDOR_VERIFICATION_TRANSITIONS: Record<string, string[]> = {
  pending: ['verified', 'rejected'],
  rejected: ['pending'],
  verified: [],    // terminal
};

// ─── Section 17: Dispute Lifecycle ─────────────────────────────────────────
export const DISPUTE_STATUS_TRANSITIONS: Record<string, string[]> = {
  open: ['in_progress'],
  in_progress: ['resolved', 'closed'],
  resolved: [],    // terminal
  closed: [],      // terminal
};

// ─── Section 18: Deposit Refund Lifecycle ──────────────────────────────────
export const DEPOSIT_REFUND_TRANSITIONS: Record<string, string[]> = {
  pending_processing: ['approved', 'rejected'],
  approved: ['processing'],
  processing: ['completed'],
  completed: [],   // terminal
  rejected: [],    // terminal
};

export const TENANT_INVITATION_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'expired'],
  accepted: [],    // terminal
  expired: [],     // terminal
};

// ─── Section 5: Overdue Escalation (collections_cases) ─────────────────────
export const COLLECTIONS_CASE_TRANSITIONS: Record<string, string[]> = {
  initiated: ['in_progress'],
  in_progress: ['resolved'],
  resolved: [],    // terminal — resolution_type: paid_in_full | payment_plan | write_off | eviction
};

// ─── Section 24: Waiting List Lifecycle ────────────────────────────────────
export const WAITING_LIST_TRANSITIONS: Record<string, string[]> = {
  interested: ['applied', 'rejected'],
  applied: ['offered', 'rejected', 'waitlisted'],
  offered: ['accepted', 'rejected'],
  waitlisted: ['offered', 'rejected'],
  accepted: [],    // terminal
  rejected: [],    // terminal
};

// ─── Section 25: Contract Amendment Lifecycle ──────────────────────────────
export const AMENDMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['signed', 'rejected'],
  signed: [],      // terminal
  rejected: [],    // terminal
  cancelled: [],   // terminal
};

// ─── Section 20: Forum Report Moderation ───────────────────────────────────
export const FORUM_REPORT_TRANSITIONS: Record<string, string[]> = {
  pending: ['reviewed'],
  reviewed: ['resolved', 'action_taken', 'dismissed'],
  resolved: [],      // terminal
  action_taken: [],   // terminal
  dismissed: [],      // terminal
};

// ─── Section 21: OCR Result Lifecycle ──────────────────────────────────────
export const OCR_RESULT_TRANSITIONS: Record<string, string[]> = {
  processing: ['completed', 'failed', 'requires_review'],
  requires_review: ['completed', 'failed'],
  completed: [],   // terminal
  failed: [],      // terminal
};

// ─── Section 22: Payment Verification Lifecycle ───────────────────────────
export const PAYMENT_VERIFICATION_TRANSITIONS: Record<string, string[]> = {
  pending: ['auto_matched', 'confirmed', 'rejected'],
  auto_matched: ['confirmed', 'rejected'],
  confirmed: [],   // terminal
  rejected: [],    // terminal
};

// ─── Section 23: DSS Recommendation Lifecycle ─────────────────────────────
export const DSS_RECOMMENDATION_TRANSITIONS: Record<string, string[]> = {
  generated: ['viewed', 'accepted', 'rejected'],
  viewed: ['accepted', 'rejected'],
  accepted: ['measured'],
  rejected: [],    // terminal
  measured: [],    // terminal
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates whether a status transition is allowed.
 * @returns true if the transition is valid
 */
export const isValidTransition = (
  transitions: Record<string, string[]>,
  currentStatus: string,
  newStatus: string
): boolean => {
  const allowedTransitions = transitions[currentStatus];
  if (!allowedTransitions) return false;
  return allowedTransitions.includes(newStatus);
};

/**
 * Returns allowed next statuses for a given current status.
 */
export const getAllowedTransitions = (
  transitions: Record<string, string[]>,
  currentStatus: string
): string[] => {
  return transitions[currentStatus] || [];
};

/**
 * Checks if a status is a terminal state (no outgoing transitions).
 */
export const isTerminalState = (
  transitions: Record<string, string[]>,
  status: string
): boolean => {
  const allowed = transitions[status];
  return allowed !== undefined && allowed.length === 0;
};
