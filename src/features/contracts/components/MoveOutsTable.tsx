import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { formatCurrency } from '@/shared/utils/currency';
import { differenceInDays, format } from 'date-fns';
import { AlertTriangle, Calendar, ClipboardCheck, Eye, MoreHorizontal, Wallet } from 'lucide-react';
import { MoveOutInspection, MoveOutNotice, TenantProfile } from '../types';
import { MoveOutStatusBadge } from './MoveOutStatusBadge';

import { id } from 'date-fns/locale';

interface MoveOutsTableProps {
  notices: MoveOutNotice[];
  inspections?: MoveOutInspection[];
  tenantProfiles?: Record<string, TenantProfile>;
  onScheduleInspection: (notice: MoveOutNotice) => void;
  onConductInspection: (notice: MoveOutNotice) => void;
  type: 'upcoming' | 'completed';
  page: number;
  totalPages: number;
  totalNotices: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function MoveOutsTable({
  notices, inspections, tenantProfiles, onScheduleInspection, onConductInspection, type,
  page, totalPages, totalNotices, onPageChange, itemsPerPage,
  selectedIds, onSelectionChange
}: MoveOutsTableProps) {
  const navigate = useNavigate();
  const selectable = !!onSelectionChange;
  const allSelected = selectable && notices.length > 0 && notices.every(n => selectedIds?.has(n.id));
  const someSelected = selectable && notices.some(n => selectedIds?.has(n.id)) && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (allSelected) {
      notices.forEach(n => next.delete(n.id));
    } else {
      notices.forEach(n => next.add(n.id));
    }
    onSelectionChange(next);
  };

  const toggleOne = (noticeId: string) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(noticeId)) next.delete(noticeId);
    else next.add(noticeId);
    onSelectionChange(next);
  };

  if (notices.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Tidak ada data pindah keluar"
        description={
          type === 'upcoming'
            ? 'Tidak ada jadwal pindah keluar mendatang.'
            : 'Tidak ada data pindah keluar yang selesai.'
        }
      />
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border/40">
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  ref={undefined}
                  onCheckedChange={toggleAll}
                  aria-label="Pilih semua"
                  {...(someSelected ? { 'data-state': 'indeterminate' } : {})}
                />
              </TableHead>
            )}
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Unit</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Penyewa</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Tanggal Pindah</TableHead>
            {type === 'upcoming' && <TableHead className="text-xs uppercase tracking-wider font-semibold">Sisa Hari</TableHead>}
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Deposit</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Inspeksi</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notices.map((notice) => {
            const inspection = inspections?.find((i) => i.move_out_notice_id === notice.id);
            const tenant = tenantProfiles?.[notice.tenant_user_id];
            const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());
            const isUrgent = daysUntil <= 7 && type === 'upcoming';
            const isSelected = selectedIds?.has(notice.id);

            return (
              <TableRow
                key={notice.id}
                className={`hover:bg-primary/5 transition-colors cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('[role="checkbox"]') || target.closest('button') || target.closest('[role="menuitem"]')) return;
                  navigate(`/merchant/move-outs/${notice.id}`);
                }}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(notice.id)}
                      aria-label={`Pilih ${notice.contract?.unit?.unit_number}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  {notice.contract?.unit?.unit_number}
                  <span className="block text-xs text-muted-foreground">
                    {notice.contract?.unit?.property?.name}
                  </span>
                </TableCell>
                <TableCell>
                  {tenant?.full_name || 'Tidak Diketahui'}
                  <span className="block text-xs text-muted-foreground">
                    {tenant?.email}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(notice.intended_move_out_date), 'dd MMM yyyy', { locale: id })}
                  {notice.is_early_termination && (
                    <span className="flex items-center text-xs text-warning mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Pemutusan Awal
                    </span>
                  )}
                </TableCell>
                {type === 'upcoming' && (
                  <TableCell>
                    <span className={isUrgent ? 'text-destructive font-medium' : ''}>
                      {daysUntil} hari
                    </span>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center">
                    <Wallet className="h-3 w-3 mr-1 text-muted-foreground" />
                    {formatCurrency(notice.contract?.deposit_amount || 0)}
                  </div>
                </TableCell>
                <TableCell>
                  {inspection?.status === 'scheduled' ? (
                    <span className="text-sm">
                      {format(new Date(inspection.scheduled_date!), 'dd MMM', { locale: id })}
                    </span>
                  ) : inspection?.status === 'completed' ? (
                    <span className="text-sm text-success font-medium">Selesai</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Belum dijadwalkan</span>
                  )}
                </TableCell>
                <TableCell>
                  <MoveOutStatusBadge notice={notice} inspection={inspection} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl" aria-label="Buka menu aksi">
                        <span className="sr-only">Buka menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                      {!inspection && type === 'upcoming' && (
                        <DropdownMenuItem onClick={() => onScheduleInspection(notice)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Jadwalkan Inspeksi
                        </DropdownMenuItem>
                      )}
                      {inspection?.status === 'scheduled' && (
                        <DropdownMenuItem onClick={() => onConductInspection(notice)}>
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Lakukan Inspeksi
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat Detail
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalNotices}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        itemLabel="pindah keluar"
      />
    </div>
  );
}
