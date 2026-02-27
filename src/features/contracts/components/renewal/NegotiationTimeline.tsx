import { Badge } from '@/shared/components/ui/badge';
import { ArrowRight, Check, X, MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface NegotiationEvent {
  type: 'merchant_proposed' | 'tenant_countered' | 'agreed' | 'rejected' | 'signed';
  date: string;
  details?: { newRent?: number; notes?: string };
}

interface Props {
  events: NegotiationEvent[];
}

const iconMap = {
  merchant_proposed: Send,
  tenant_countered: MessageSquare,
  agreed: Check,
  rejected: X,
  signed: Check,
};

const labelMap: Record<string, string> = {
  merchant_proposed: 'Penawaran Merchant',
  tenant_countered: 'Counter-Offer Penyewa',
  agreed: 'Disepakati',
  rejected: 'Ditolak',
  signed: 'Ditandatangani',
};

const colorMap: Record<string, string> = {
  merchant_proposed: 'bg-primary/10 text-primary',
  tenant_countered: 'bg-warning/10 text-warning',
  agreed: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  signed: 'bg-success/10 text-success',
};

export function NegotiationTimeline({ events }: Props) {
  if (!events.length) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground">Riwayat Negosiasi</h4>
      <div className="relative pl-6 space-y-4">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
        {events.map((event, i) => {
          const Icon = iconMap[event.type] || Send;
          return (
            <div key={i} className="relative flex gap-3">
              <div className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center ${colorMap[event.type] || 'bg-muted'}`}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{labelMap[event.type]}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.date), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                  </span>
                </div>
                {event.details?.newRent && (
                  <p className="text-sm text-muted-foreground">
                    Rp {event.details.newRent.toLocaleString('id-ID')}/bln
                  </p>
                )}
                {event.details?.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{event.details.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
