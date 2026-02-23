import { useMemo } from 'react';
import { calculatePasswordStrength, PasswordStrength } from '@/shared/utils/validations/auth';
import { cn } from '@/shared/utils/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; bgColor: string }> = {
  weak: { label: 'Lemah', color: 'text-destructive', bgColor: 'bg-destructive' },
  fair: { label: 'Cukup', color: 'text-warning', bgColor: 'bg-warning' },
  good: { label: 'Baik', color: 'text-primary', bgColor: 'bg-primary' },
  strong: { label: 'Kuat', color: 'text-success', bgColor: 'bg-success' },
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
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Kekuatan password:</span>
          <span className={cn('font-medium', config.color)}>{config.label}</span>
        </div>
        <div 
          className="h-2 w-full bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-label={`Kekuatan password: ${config.label}`}
        >
          <div 
            className={cn('h-full transition-all duration-300', config.bgColor)}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-1" role="list" aria-label="Persyaratan password">
        {requirements.map((req, index) => {
          const isMet = req.regex.test(password);
          return (
            <div 
              key={index}
              role="listitem"
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                isMet ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {isMet ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
