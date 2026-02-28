import { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Mail, CreditCard, Phone, ExternalLink, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface AlertItemExtended {
  id: string;
  type: 'overdue' | 'expense_approval' | 'maintenance' | 'contract_expiry' | 'preventive_overdue';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  path: string;
  // Action metadata (overdue invoices)
  invoiceId?: string;
  tenantUserId?: string;
  contractId?: string;
  merchantId?: string;
  invoiceAmount?: number;
  unitNumber?: string;
  tenantName?: string;
  daysOverdue?: number;
}

type AlertAction = 'send_reminder' | 'process_payment' | 'navigate' | 'dismiss';

interface Props {
  alert: AlertItemExtended;
  icon: LucideIcon;
  expanded: boolean;
  onToggle: () => void;
  onAction: (action: AlertAction) => void;
  actioned?: string | null; // action summary text
  actionLoading?: boolean;
}

const colorMap: Record<string, string> = {
  high: 'border-destructive/30 bg-destructive/5',
  medium: 'border-warning/30 bg-warning/5',
  low: 'border-border',
};

export function AlertActionCard({ alert, icon: Icon, expanded, onToggle, onAction, actioned, actionLoading }: Props) {
  return (
    <Card className={`rounded-xl transition-all ${colorMap[alert.severity]} ${expanded ? 'shadow-md' : 'hover:shadow-sm'}`}>
      {/* Header - always visible */}
      <CardContent
        className="p-3 flex items-center gap-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
        </div>
        {actioned ? (
          <Badge variant="outline" className="shrink-0 text-xs border-primary/30 text-primary gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Selesai
          </Badge>
        ) : (
          <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="shrink-0 text-xs">
            {alert.severity === 'high' ? 'Urgent' : alert.severity === 'medium' ? 'Perlu Aksi' : 'Info'}
          </Badge>
        )}
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </CardContent>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border/50">
          {actioned ? (
            <div className="flex items-center gap-2 py-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span>{actioned}</span>
            </div>
          ) : alert.type === 'overdue' ? (
            <div className="flex flex-wrap gap-2 pt-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                disabled={actionLoading}
                onClick={(e) => { e.stopPropagation(); onAction('send_reminder'); }}
              >
                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                Kirim Pengingat
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={(e) => { e.stopPropagation(); onAction('process_payment'); }}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Proses Pembayaran
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={(e) => { e.stopPropagation(); onAction('navigate'); }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Lihat Detail
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={(e) => { e.stopPropagation(); onAction('dismiss'); }}
              >
                <X className="h-3.5 w-3.5" />
                Dismiss
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={(e) => { e.stopPropagation(); onAction('navigate'); }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Lihat Detail
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={(e) => { e.stopPropagation(); onAction('dismiss'); }}
              >
                <X className="h-3.5 w-3.5" />
                Dismiss
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
