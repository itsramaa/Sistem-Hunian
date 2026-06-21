import React from 'react';
import { cn } from '@/shared/utils/utils';

interface DataCardField {
  label: string;
  value?: string | number | null;
}

interface DataCardProps {
  header?: React.ReactNode;
  fields?: DataCardField[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Mobile-first card component for displaying tabular data as cards.
 * Used as a stacked card replacement for tables on mobile screens.
 */
export function DataCard({ header, fields, actions, className }: DataCardProps) {
  const visibleFields = fields?.filter(f => f.value !== undefined && f.value !== null && f.value !== '');

  return (
    <div className={cn('glass-card p-4 space-y-3 rounded-2xl border border-border/40', className)}>
      {header && <div>{header}</div>}
      {visibleFields && visibleFields.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          {visibleFields.map((field, i) => (
            <div key={i} className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{field.label}</p>
              <p className="font-medium text-foreground truncate">{field.value}</p>
            </div>
          ))}
        </div>
      )}
      {actions && (
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/30">
          {actions}
        </div>
      )}
    </div>
  );
}
