import { Badge } from '@/shared/components/ui/badge';
import { Clock, FileText, PenLine, CheckCircle, XCircle } from 'lucide-react';

interface ContractStatusBadgeProps {
  status: string | null;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary" className="gap-1 rounded-full"><FileText className="h-3 w-3" /> Draf</Badge>;
    case 'pending_signature':
      return <Badge variant="outline" className="text-primary border-primary gap-1 rounded-full"><PenLine className="h-3 w-3" /> Menunggu Tanda Tangan</Badge>;
    case 'active':
      return <Badge className="bg-success text-success-foreground rounded-full">Aktif</Badge>;
    case 'notice':
      return <Badge variant="outline" className="text-warning border-warning gap-1 rounded-full"><Clock className="h-3 w-3" /> Masa Notice</Badge>;
    case 'completed':
      return <Badge className="bg-success/80 text-success-foreground gap-1 rounded-full"><CheckCircle className="h-3 w-3" /> Selesai</Badge>;
    case 'expired':
      return <Badge variant="secondary" className="rounded-full">Kedaluwarsa</Badge>;
    case 'terminated':
      return <Badge variant="destructive" className="rounded-full">Diakhiri</Badge>;
    case 'cancelled':
      return <Badge variant="destructive" className="gap-1 rounded-full"><XCircle className="h-3 w-3" /> Dibatalkan</Badge>;
    default:
      return <Badge variant="outline" className="rounded-full">{status || 'Tidak Diketahui'}</Badge>;
  }
}
