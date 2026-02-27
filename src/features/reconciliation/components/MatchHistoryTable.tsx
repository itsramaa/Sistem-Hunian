import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { PaymentMatch } from '../services/reconciliationService';

interface Props {
  matches?: PaymentMatch[];
  loading?: boolean;
}

export function MatchHistoryTable({ matches, loading }: Props) {
  if (loading) return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  if (!matches?.length) return <p className="text-center text-muted-foreground py-8">Belum ada riwayat pencocokan</p>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment ID</TableHead>
            <TableHead>Invoice ID</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Keyakinan</TableHead>
            <TableHead>Alasan</TableHead>
            <TableHead>Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map(m => (
            <TableRow key={m.id}>
              <TableCell className="font-mono text-xs">{m.paymentId.slice(0, 8)}...</TableCell>
              <TableCell className="font-mono text-xs">{m.invoiceId.slice(0, 8)}...</TableCell>
              <TableCell className="text-right font-semibold">Rp {m.matchedAmount.toLocaleString('id-ID')}</TableCell>
              <TableCell>
                <Badge variant={m.matchType === 'auto' ? 'default' : 'secondary'}>
                  {m.matchType === 'auto' ? 'Otomatis' : 'Manual'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={m.matchConfidence >= 0.9 ? 'text-green-600' : m.matchConfidence >= 0.5 ? 'text-amber-600' : 'text-destructive'}>
                  {Math.round(m.matchConfidence * 100)}%
                </span>
              </TableCell>
              <TableCell className="text-xs max-w-[150px] truncate">{m.matchReason || '-'}</TableCell>
              <TableCell className="text-xs">{format(new Date(m.createdAt), 'dd MMM yyyy', { locale: idLocale })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
