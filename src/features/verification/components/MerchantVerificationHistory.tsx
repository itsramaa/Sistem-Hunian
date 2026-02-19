import { CheckCircle, XCircle, Clock, AlertTriangle, UserCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useMerchantHistory } from '../hooks/useMerchantHistory';
import { ACTION_CONFIG } from '@/features/users/constants/merchant';

interface MerchantVerificationHistoryProps {
  merchantId: string;
}

export function MerchantVerificationHistory({ merchantId }: MerchantVerificationHistoryProps) {
  const { history, loading } = useMerchantHistory(merchantId);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No verification history available
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {history.map((entry, index) => {
          const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.submitted;
          const Icon = config.icon;

          return (
            <div key={entry.id} className="relative flex gap-4 pl-2">
              {/* Timeline dot */}
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`${config.color} border-current`}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {entry.performer && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <UserCircle className="h-3 w-3" />
                    <span>{entry.performer.full_name || entry.performer.email}</span>
                  </div>
                )}

                {entry.approval_notes && (
                  <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    <span className="font-medium">Notes:</span> {entry.approval_notes}
                  </p>
                )}

                {entry.rejection_reason && (
                  <div className="mt-2 text-sm bg-destructive/10 p-2 rounded space-y-1">
                    <p><span className="font-medium text-destructive">Reason:</span> {entry.rejection_reason}</p>
                    {entry.rejection_details && (
                      <p><span className="font-medium">Details:</span> {entry.rejection_details}</p>
                    )}
                    {entry.resubmission_instructions && (
                      <p><span className="font-medium">Instructions:</span> {entry.resubmission_instructions}</p>
                    )}
                  </div>
                )}

                {entry.old_status && entry.new_status && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="capitalize text-xs">{entry.old_status}</Badge>
                    <span>→</span>
                    <Badge variant="secondary" className="capitalize text-xs">{entry.new_status}</Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
