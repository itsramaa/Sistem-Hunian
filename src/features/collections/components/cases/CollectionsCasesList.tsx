import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { CheckCircle, MoreHorizontal, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { CollectionsCase } from '../../services/collectionsCaseService';
import { getAllowedTransitions, COLLECTIONS_CASE_TRANSITIONS } from '@/shared/constants/state-machines';

const statusLabel: Record<string, string> = { initiated: 'Dibuat', in_progress: 'Ditangani', resolved: 'Selesai' };
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = { initiated: 'secondary', in_progress: 'default', resolved: 'default' };

interface Props {
  cases?: CollectionsCase[];
  loading?: boolean;
  onUpdateStatus: (caseId: string, currentStatus: string, newStatus: string) => void;
}

export function CollectionsCasesList({ cases, loading, onUpdateStatus }: Props) {
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  if (!cases?.length) return <p className="text-center text-muted-foreground py-8">Belum ada kasus penagihan</p>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Penyewa</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Hari</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.invoiceNumber}</TableCell>
              <TableCell>{c.tenantName}</TableCell>
              <TableCell>{c.unitNumber}</TableCell>
              <TableCell>Rp {c.totalDue.toLocaleString('id-ID')}</TableCell>
              <TableCell>{c.daysOverdue}</TableCell>
              <TableCell><Badge variant={statusVariant[c.status] || 'secondary'}>{statusLabel[c.status] || c.status}</Badge></TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {getAllowedTransitions(COLLECTIONS_CASE_TRANSITIONS, c.status).map(next => (
                      <DropdownMenuItem key={next} onClick={() => onUpdateStatus(c.id, c.status, next)}>
                        {next === 'in_progress' && <PlayCircle className="h-4 w-4 mr-2" />}
                        {next === 'resolved' && <CheckCircle className="h-4 w-4 mr-2" />}
                        {statusLabel[next] || next}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
