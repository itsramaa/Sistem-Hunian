import { cn } from '@/shared/utils/utils';

const ESCALATION_STEPS = [
  { key: 'initiated', label: 'Dibuat', day: 'T+0' },
  { key: 'reminder_sent', label: 'Pengingat', day: 'T+3' },
  { key: 'follow_up', label: 'Tindak Lanjut', day: 'T+7' },
  { key: 'in_progress', label: 'Ditangani', day: 'T+15' },
  { key: 'escalated', label: 'Eskalasi', day: 'T+15+' },
  { key: 'legal', label: 'Hukum', day: 'T+30' },
  { key: 'resolved', label: 'Selesai', day: '' },
];

interface Props {
  currentStatus: string;
}

export function EscalationPathIndicator({ currentStatus }: Props) {
  const currentIdx = ESCALATION_STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {ESCALATION_STEPS.map((step, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;

        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex flex-col items-center min-w-[60px]">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                  isPast && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/30',
                  isFuture && 'bg-muted border-border text-muted-foreground'
                )}
              >
                {i + 1}
              </div>
              <span className={cn('text-[10px] mt-1 text-center leading-tight', isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </span>
              {step.day && (
                <span className="text-[9px] text-muted-foreground">{step.day}</span>
              )}
            </div>
            {i < ESCALATION_STEPS.length - 1 && (
              <div className={cn('h-0.5 w-4 flex-shrink-0', isPast ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
