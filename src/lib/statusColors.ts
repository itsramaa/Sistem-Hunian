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
};
