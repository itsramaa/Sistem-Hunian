import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderAutoRejectCountdownProps {
  createdAt: string;
  autoRejectHours?: number;
  className?: string;
}

export function OrderAutoRejectCountdown({
  createdAt,
  autoRejectHours = 24,
  className,
}: OrderAutoRejectCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    progress: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, progress: 100, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const created = new Date(createdAt).getTime();
      const deadline = created + autoRejectHours * 60 * 60 * 1000;
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, progress: 0, isExpired: true };
      }

      const totalMs = autoRejectHours * 60 * 60 * 1000;
      const progress = (diff / totalMs) * 100;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, progress, isExpired: false };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, autoRejectHours]);

  const isUrgent = timeLeft.progress < 25;
  const isWarning = timeLeft.progress < 50 && !isUrgent;

  if (timeLeft.isExpired) {
    return (
      <div className={cn('flex items-center gap-2 text-destructive', className)}>
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Auto-rejected</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className={cn(
            'h-4 w-4',
            isUrgent && 'text-destructive animate-pulse',
            isWarning && 'text-warning',
            !isUrgent && !isWarning && 'text-muted-foreground'
          )} />
          <span className={cn(
            'text-sm font-medium',
            isUrgent && 'text-destructive',
            isWarning && 'text-warning'
          )}>
            Auto-reject in:
          </span>
        </div>
        <span className={cn(
          'text-sm font-mono font-bold',
          isUrgent && 'text-destructive',
          isWarning && 'text-warning'
        )}>
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
      <Progress 
        value={timeLeft.progress} 
        className={cn(
          'h-2',
          isUrgent && '[&>div]:bg-destructive',
          isWarning && '[&>div]:bg-warning'
        )}
      />
      {isUrgent && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Respond now to avoid auto-rejection
        </p>
      )}
    </div>
  );
}
