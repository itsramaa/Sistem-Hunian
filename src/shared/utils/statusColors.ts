/**
 * Centralized status and priority color mappings
 */

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const getPriorityColor = (priority: string): BadgeVariant => {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const getJobStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'accepted':
    case 'in_progress':
      return 'default';
    case 'completed':
      return 'outline';
    case 'rejected':
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const getOrderStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'confirmed':
    case 'processing':
      return 'default';
    case 'ready':
    case 'completed':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const getPaymentStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case 'paid':
      return 'outline';
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const getVerificationStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case 'verified':
    case 'approved':
      return 'outline';
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// Tailwind class mappings for custom styling
export const priorityColorClasses: Record<string, { text: string; bg: string }> = {
  urgent: { text: 'text-destructive', bg: 'bg-destructive/10' },
  high: { text: 'text-destructive', bg: 'bg-destructive/10' },
  medium: { text: 'text-warning', bg: 'bg-warning/10' },
  low: { text: 'text-muted-foreground', bg: 'bg-muted' },
};

export const statusColorClasses: Record<string, { text: string; bg: string }> = {
  pending: { text: 'text-warning', bg: 'bg-warning/10' },
  active: { text: 'text-primary', bg: 'bg-primary/10' },
  in_progress: { text: 'text-primary', bg: 'bg-primary/10' },
  completed: { text: 'text-success', bg: 'bg-success/10' },
  cancelled: { text: 'text-destructive', bg: 'bg-destructive/10' },
  rejected: { text: 'text-destructive', bg: 'bg-destructive/10' },
  // Subscription statuses
  trialing: { text: 'text-primary', bg: 'bg-primary/10' },
  past_due: { text: 'text-warning', bg: 'bg-warning/10' },
  suspended: { text: 'text-destructive', bg: 'bg-destructive/10' },
  // Invoice statuses
  draft: { text: 'text-muted-foreground', bg: 'bg-muted' },
  paid: { text: 'text-success', bg: 'bg-success/10' },
  overdue: { text: 'text-destructive', bg: 'bg-destructive/10' },
  // Contract statuses
  terminated: { text: 'text-destructive', bg: 'bg-destructive/10' },
  expired: { text: 'text-muted-foreground', bg: 'bg-muted' },
  // Verification statuses
  verified: { text: 'text-success', bg: 'bg-success/10' },
  unverified: { text: 'text-warning', bg: 'bg-warning/10' },
  // Maintenance statuses
  acknowledged: { text: 'text-primary', bg: 'bg-primary/10' },
};

// Get status color for any status
export const getStatusColorClasses = (status: string): { text: string; bg: string } => {
  return statusColorClasses[status] || { text: 'text-muted-foreground', bg: 'bg-muted' };
};

// Invoice status color
export const getInvoiceStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case 'paid':
      return 'outline';
    case 'pending':
    case 'draft':
      return 'secondary';
    case 'overdue':
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// Contract status color
export const getContractStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case 'active':
      return 'outline';
    case 'pending':
      return 'secondary';
    case 'terminated':
    case 'cancelled':
      return 'destructive';
    case 'expired':
      return 'default';
    default:
      return 'secondary';
  }
};

// Maintenance status color
export const getMaintenanceStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'acknowledged':
    case 'in_progress':
      return 'default';
    case 'completed':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// Escrow/Transaction status colors
export const getEscrowStatusColors = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-success/10 text-success border-success/20';
    case 'pending':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'processing':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'failed':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted';
  }
};

// Transaction type colors
export const getTransactionTypeColors = (type: string): { isDeposit: boolean; className: string } => {
  const isDeposit = type === 'deposit' || type === 'payment_received';
  return {
    isDeposit,
    className: isDeposit ? 'text-success' : 'text-destructive',
  };
};

// ── SiHuni Domain Status ────────────────────────────────────────────────────

export interface SiHuniStatusConfig {
  label: string;
  className: string;
}

const siHuniStatusMap: Record<string, SiHuniStatusConfig> = {
  // Room status
  available:        { label: 'Tersedia',       className: 'bg-success/10 text-success border-success/20' },
  dp_confirmation:  { label: 'Konfirmasi DP',  className: 'bg-warning/10 text-warning border-warning/20' },
  occupied:         { label: 'Terisi',          className: 'bg-destructive/10 text-destructive border-destructive/20' },
  // Tenant status
  active:           { label: 'Aktif',           className: 'bg-success/10 text-success border-success/20' },
  checked_out:      { label: 'Checkout',        className: 'bg-muted text-muted-foreground border-border' },
  // Payment status
  paid:             { label: 'Lunas',           className: 'bg-success/10 text-success border-success/20' },
  unpaid:           { label: 'Belum Bayar',     className: 'bg-warning/10 text-warning border-warning/20' },
  overdue:          { label: 'Jatuh Tempo',     className: 'bg-destructive/10 text-destructive border-destructive/20' },
  cancelled:        { label: 'Dibatalkan',      className: 'bg-muted text-muted-foreground border-border' },
  // Confirmation (DP) status
  pending:          { label: 'Pending',         className: 'bg-warning/10 text-warning border-warning/20' },
  confirmed:        { label: 'Dikonfirmasi',    className: 'bg-success/10 text-success border-success/20' },
  expired:          { label: 'Kedaluwarsa',     className: 'bg-muted text-muted-foreground border-border' },
  // Maintenance status
  reported:         { label: 'Dilaporkan',      className: 'bg-info/10 text-info border-info/20' },
  in_progress:      { label: 'Diproses',        className: 'bg-warning/10 text-warning border-warning/20' },
  completed:        { label: 'Selesai',         className: 'bg-success/10 text-success border-success/20' },
};

/**
 * Get label + className for any SiHuni domain status.
 * Use with Shadcn Badge: <Badge className={config.className}>{config.label}</Badge>
 */
export const getSiHuniStatus = (status: string): SiHuniStatusConfig => {
  return siHuniStatusMap[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' };
};
