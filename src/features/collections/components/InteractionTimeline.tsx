import { Phone, MessageSquare, Mail, MapPin, FileText, Send } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/shared/utils/utils';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';

export interface Interaction {
  id: string;
  caseId: string;
  merchantId: string;
  interactionType: string;
  direction: string;
  outcome: string | null;
  notes: string | null;
  contactPerson: string | null;
  followUpDate: string | null;
  createdBy: string | null;
  createdAt: string;
}

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  whatsapp: Send,
  visit: MapPin,
  letter: FileText,
};

const typeLabels: Record<string, string> = {
  call: 'Telepon',
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
  visit: 'Kunjungan',
  letter: 'Surat',
};

const outcomeLabels: Record<string, string> = {
  answered: 'Dijawab',
  no_answer: 'Tidak Dijawab',
  voicemail: 'Voicemail',
  promise_to_pay: 'Janji Bayar',
  refused: 'Menolak',
  escalated: 'Dieskalasi',
};

const outcomeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  answered: 'secondary',
  no_answer: 'outline',
  voicemail: 'outline',
  promise_to_pay: 'default',
  refused: 'destructive',
  escalated: 'destructive',
};

interface Props {
  interactions?: Interaction[];
  loading?: boolean;
}

export function InteractionTimeline({ interactions, loading }: Props) {
  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  if (!interactions?.length) return <p className="text-sm text-muted-foreground py-4 text-center">Belum ada interaksi tercatat</p>;

  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
      {interactions.map((item) => {
        const Icon = typeIcons[item.interactionType] || MessageSquare;
        return (
          <div key={item.id} className="relative flex gap-3">
            <div className={cn(
              'absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center bg-background border-2 border-primary z-10'
            )}>
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 bg-muted/40 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{typeLabels[item.interactionType] || item.interactionType}</span>
                <Badge variant="outline" className="text-[10px]">{item.direction === 'inbound' ? 'Masuk' : 'Keluar'}</Badge>
                {item.outcome && (
                  <Badge variant={outcomeVariant[item.outcome] || 'secondary'} className="text-[10px]">
                    {outcomeLabels[item.outcome] || item.outcome}
                  </Badge>
                )}
              </div>
              {item.contactPerson && <p className="text-xs text-muted-foreground">Kontak: {item.contactPerson}</p>}
              {item.notes && <p className="text-sm">{item.notes}</p>}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{format(new Date(item.createdAt), 'dd MMM yyyy HH:mm', { locale: idLocale })}</span>
                {item.followUpDate && <span>Follow-up: {format(new Date(item.followUpDate), 'dd MMM yyyy', { locale: idLocale })}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
