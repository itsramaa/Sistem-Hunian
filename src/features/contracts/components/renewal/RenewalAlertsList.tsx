import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import type { RenewalAlert } from '../../services/renewalService';

function urgencyBadge(endDate: string) {
  const days = differenceInDays(new Date(endDate), new Date());
  if (days <= 7) return <Badge variant="destructive">{days} hari lagi</Badge>;
  if (days <= 30) return <Badge variant="secondary">{days} hari lagi</Badge>;
  return <Badge variant="secondary">{days} hari lagi</Badge>;
}

function formatCurrency(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`;
}

interface Props {
  alerts?: RenewalAlert[];
  loading?: boolean;
}

export function RenewalAlertsList({ alerts, loading }: Props) {
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  if (!alerts?.length) return <p className="text-center text-muted-foreground py-8">Tidak ada kontrak yang akan berakhir dalam 90 hari</p>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Penyewa</TableHead>
            <TableHead>Berakhir</TableHead>
            <TableHead>Sewa</TableHead>
            <TableHead>Urgensi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map(a => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.unitNumber}</TableCell>
              <TableCell>{a.tenantName || '-'}</TableCell>
              <TableCell>{format(new Date(a.endDate), 'dd MMM yyyy', { locale: id })}</TableCell>
              <TableCell>{formatCurrency(a.rentAmount)}</TableCell>
              <TableCell>{urgencyBadge(a.endDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
