import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Send, UserCheck, UserX } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { WaitingListApplicant } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getAllowedTransitions, WAITING_LIST_TRANSITIONS } from '@/shared/constants/state-machines';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  interested: 'outline',
  applied: 'secondary',
  offered: 'default',
  waitlisted: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
};

const statusLabel: Record<string, string> = {
  interested: 'Tertarik',
  applied: 'Melamar',
  offered: 'Ditawari',
  waitlisted: 'Daftar Tunggu',
  accepted: 'Diterima',
  rejected: 'Ditolak',
};

interface Props {
  applicants?: WaitingListApplicant[];
  loading?: boolean;
  onUpdateStatus: (id: string, currentStatus: string, newStatus: string) => void;
  onSendOffer: (applicantId: string) => void;
}

export function WaitingListTable({ applicants, loading, onUpdateStatus, onSendOffer }: Props) {
  const [search, setSearch] = useState('');

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const filtered = (applicants || []).filter(a =>
    a.applicantName.toLowerCase().includes(search.toLowerCase()) ||
    (a.applicantPhone || '').includes(search) ||
    (a.applicantEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (v: number | null) => v != null ? `Rp ${v.toLocaleString('id-ID')}` : '-';

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari pelamar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Pindah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Skor</TableHead>
              <TableHead className="w-[80px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada data pelamar</TableCell></TableRow>
            ) : filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.applicantName}</TableCell>
                <TableCell>{a.applicantPhone || '-'}</TableCell>
                <TableCell className="text-sm">{a.budgetMin || a.budgetMax ? `${formatCurrency(a.budgetMin)} - ${formatCurrency(a.budgetMax)}` : '-'}</TableCell>
                <TableCell>{a.preferredMoveIn ? format(new Date(a.preferredMoveIn), 'dd MMM yyyy', { locale: id }) : '-'}</TableCell>
                <TableCell><Badge variant={statusVariant[a.status] || 'outline'}>{statusLabel[a.status] || a.status}</Badge></TableCell>
                <TableCell>{a.qualityScore != null ? a.qualityScore : '-'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {getAllowedTransitions(WAITING_LIST_TRANSITIONS, a.status).map(next => (
                        <DropdownMenuItem key={next} onClick={() => next === 'offered' ? onSendOffer(a.id) : onUpdateStatus(a.id, a.status, next)}>
                          {next === 'offered' && <Send className="h-4 w-4 mr-2" />}
                          {next === 'accepted' && <UserCheck className="h-4 w-4 mr-2" />}
                          {next === 'rejected' && <UserX className="h-4 w-4 mr-2" />}
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
    </div>
  );
}
