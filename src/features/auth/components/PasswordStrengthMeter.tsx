import { useMemo } from 'react';
import { calculatePasswordStrength, PasswordStrength } from '@/shared/utils/validations/auth';
import { cn } from '@/shared/utils/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; bgColor: string; segments: number }> = {
  weak: { label: 'Lemah', color: 'text-destructive', bgColor: 'bg-destructive', segments: 1 },
  fair: { label: 'Cukup', color: 'text-warning', bgColor: 'bg-warning', segments: 2 },
  good: { label: 'Baik', color: 'text-primary', bgColor: 'bg-primary', segments: 3 },
  strong: { label: 'Kuat', color: 'text-success', bgColor: 'bg-success', segments: 4 },
};

const requirements = [
  { regex: /.{12,}/, label: 'Minimal 12 karakter' },
  { regex: /[A-Z]/, label: 'Huruf besar (A-Z)' },
  { regex: /[a-z]/, label: 'Huruf kecil (a-z)' },
  { regex: /[0-9]/, label: 'Angka (0-9)' },
  { regex: /[^A-Za-z0-9]/, label: 'Karakter spesial (!@#$%^&*)' },
];

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const { strength, score } = useMemo(() => {
    if (!password) return { strength: 'weak' as PasswordStrength, score: 0 };
    return calculatePasswordStrength(password);
  }, [password]);

  const config = strengthConfig[strength];

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Segmented strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Kekuatan password:</span>
          <span className={cn('font-medium', config.color)}>{config.label}</span>
        </div>
        <div 
          className="flex gap-1"
          role="progressbar"
          aria-valuenow={config.segments}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={`Kekuatan password: ${config.label}`}
        >
          {[1, 2, 3, 4].map((seg) => (
            <div 
              key={seg}
              className={cn(
                'h-2 flex-1 rounded-full transition-all duration-300',
                seg <= config.segments ? config.bgColor : 'bg-muted/50'
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5" role="list" aria-label="Persyaratan password">
        {requirements.map((req, index) => {
          const isMet = req.regex.test(password);
          return (
            <div 
              key={index}
              role="listitem"
              className={cn(
                'flex items-center gap-2 text-xs transition-all duration-200 rounded-md px-2 py-1',
                isMet 
                  ? 'text-success bg-success/10' 
                  : 'text-muted-foreground'
              )}
            >
              {isMet ? (
                <Check className="h-3 w-3 shrink-0" />
              ) : (
                <X className="h-3 w-3 shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
