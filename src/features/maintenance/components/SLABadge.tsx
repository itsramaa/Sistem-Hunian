import { Badge } from '@/shared/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { differenceInHours, differenceInMinutes, formatDistanceToNow, isPast } from 'date-fns';

interface SLABadgeProps {
  slaDeadline: string | null;
  status: string;
  showCountdown?: boolean;
}

export function SLABadge({ slaDeadline, status, showCountdown = true }: SLABadgeProps) {
  if (status === 'completed' || status === 'cancelled') {
    return null;
  }

  if (!slaDeadline) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground rounded-full">
        <Clock className="h-3 w-3" />
        No SLA
      </Badge>
    );
  }

  const deadline = new Date(slaDeadline);
  const now = new Date();
  const isBreached = isPast(deadline);
  const hoursRemaining = differenceInHours(deadline, now);
  const minutesRemaining = differenceInMinutes(deadline, now);

  let Icon = Clock;
  let label = '';
  let className = 'rounded-full';

  if (isBreached) {
    Icon = XCircle;
    label = 'SLA Breached';
    className = 'bg-destructive text-destructive-foreground rounded-full';
  } else if (hoursRemaining < 1) {
    Icon = AlertTriangle;
    label = `${minutesRemaining}m left`;
    className = 'bg-destructive/90 text-destructive-foreground animate-pulse rounded-full';
  } else if (hoursRemaining < 4) {
    Icon = AlertTriangle;
    label = `${hoursRemaining}h left`;
    className = 'bg-orange-500 text-white rounded-full';
  } else if (hoursRemaining < 24) {
    Icon = Clock;
    label = `${hoursRemaining}h left`;
    className = 'bg-yellow-500 text-white rounded-full';
  } else {
    Icon = CheckCircle;
    label = showCountdown ? formatDistanceToNow(deadline, { addSuffix: false }) : 'On track';
    className = 'bg-success/10 text-success border-success/20 rounded-full';
  }

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function getSLAText(priority: string): string {
  switch (priority) {
    case 'urgent': return '4 hours';
    case 'high': return '24 hours';
    case 'medium': return '72 hours';
    case 'low': return '7 days';
    default: return '72 hours';
  }
}