import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  verified: 'bg-success/10 text-success border-success/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  suspended: 'bg-muted text-muted-foreground border-muted',
};

export const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  verified: CheckCircle,
  rejected: XCircle,
  suspended: AlertTriangle,
};

export const ACTION_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  submitted: { icon: Clock, color: 'text-warning', label: 'Submitted' },
  approved: { icon: CheckCircle, color: 'text-success', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-destructive', label: 'Rejected' },
  resubmitted: { icon: RefreshCw, color: 'text-primary', label: 'Resubmitted' },
  suspended: { icon: AlertTriangle, color: 'text-destructive', label: 'Suspended' },
  reactivated: { icon: CheckCircle, color: 'text-success', label: 'Reactivated' },
};
