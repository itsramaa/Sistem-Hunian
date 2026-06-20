import React from 'react';
import { cn } from '@/shared/utils/utils';

/**
 * DataCard — renders a row of data as a mobile-friendly card.
 * Used by table components to switch from table to card layout on small screens.
 */
interface DataCardField {
  label: string;
  value: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

interface DataCardProps {
  fields: DataCardField[];
  actions?: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}

export function DataCard({ fields, actions, className, header }: DataCardProps) {
  const visible = fields.filter(f => f.value !== null && f.value !== undefined && f.value !== '');

  return (
    <div className={cn('glass-card p-4 space-y-3', className)}>
      {header && <div className="pb-1 border-b border-border/40">{header}</div>}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        {visible.map((field, i) => (
          <div
            key={i}
            className={cn(
              'min-w-0',
              field.fullWidth ? 'col-span-2' : 'col-span-1'
            )}
          >
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              {field.label}
            </dt>
            <dd className={cn('text-sm text-foreground truncate', field.className)}>
              {field.value || <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
        ))}
      </dl>
      {actions && (
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * TableOrCards — renders a table on desktop, cards on mobile.
 * Pass `tableView` for desktop and `cardView` for mobile.
 */
interface TableOrCardsProps {
  isMobile: boolean;
  tableView: React.ReactNode;
  cardView: React.ReactNode;
}

export function TableOrCards({ isMobile, tableView, cardView }: TableOrCardsProps) {
  return <>{isMobile ? cardView : tableView}</>;
}
