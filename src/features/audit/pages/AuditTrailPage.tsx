import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useProperties } from '@/features/properties/hooks/useProperties';
import { DataCard } from '@/shared/components/DataCard';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';

interface RoomStatusLog {
  id: string;
  room_id: string;
  nomor_kamar: string;
  nama_properti: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
  reason: string;
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  dp_confirmation: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  occupied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const statusLabel: Record<string, string> = {
  available: 'Tersedia',
  dp_confirmation: 'Konfirmasi DP',
  occupied: 'Terisi',
};

export default function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [propertyFilter, setPropertyFilter] = useState('');
  const isMobile = useIsMobile();
  const limit = 20;

  const { data: propsData } = useProperties('', 1, 100);
  const properties = propsData?.properties ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['audit-room-status', { page, limit, propertyFilter }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (propertyFilter) params.property_id = propertyFilter;
      const { data } = await apiClient.get<any>('/audit/room-status', { params });
      return { logs: data?.data ?? [], pagination: data?.pagination ?? null };
    },
  });

  const logs: RoomStatusLog[] = data?.logs ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fmt = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy HH:mm', { locale: localeId }); }
    catch { return d; }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status] ?? ''}`}>
      {statusLabel[status] ?? status}
    </span>
  );

  const Pagination = () => totalPages > 1 ? (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{(page-1)*limit+1}–{Math.min(page*limit, total)} dari {total}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full min-h-[44px] min-w-[44px]" disabled={page<=1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-xs">{page}/{totalPages}</span>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full min-h-[44px] min-w-[44px]" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Riwayat perubahan status kamar</p>
      </div>

      <Select value={propertyFilter} onValueChange={v => { setPropertyFilter(v); setPage(1); }}>
        <SelectTrigger className="w-[200px] rounded-xl h-10"><SelectValue placeholder="Semua properti" /></SelectTrigger>
        <SelectContent>
          <SelectItem value=" ">Semua properti</SelectItem>
          {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>)}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Memuat...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2 text-muted-foreground">
          <History className="h-8 w-8 opacity-30" />
          <p className="text-sm">Belum ada riwayat perubahan status.</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {logs.map(log => (
            <DataCard key={log.id}
              header={
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{log.nomor_kamar || '—'} · {log.nama_properti || '—'}</p>
                    <p className="text-xs text-muted-foreground">{fmt(log.changed_at)}</p>
                  </div>
                  <StatusBadge status={log.new_status} />
                </div>
              }
              fields={[
                { label: 'Status Lama', value: <StatusBadge status={log.old_status} /> },
                { label: 'Status Baru', value: <StatusBadge status={log.new_status} /> },
                ...(log.reason ? [{ label: 'Alasan', value: log.reason }] : []),
              ]}
            />
          ))}
          <Pagination />
        </div>
      ) : (
        <>
          <div className="glass-table overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                  <TableHead className="font-semibold text-xs uppercase">Kamar</TableHead>
                  <TableHead className="font-semibold text-xs uppercase">Properti</TableHead>
                  <TableHead className="font-semibold text-xs uppercase">Status Lama</TableHead>
                  <TableHead className="font-semibold text-xs uppercase">Status Baru</TableHead>
                  <TableHead className="font-semibold text-xs uppercase">Alasan</TableHead>
                  <TableHead className="font-semibold text-xs uppercase">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="text-sm font-medium">{log.nomor_kamar || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.nama_properti || '—'}</TableCell>
                    <TableCell><StatusBadge status={log.old_status} /></TableCell>
                    <TableCell><StatusBadge status={log.new_status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.reason || '—'}</TableCell>
                    <TableCell className="text-sm tabular-nums">{fmt(log.changed_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  );
}
