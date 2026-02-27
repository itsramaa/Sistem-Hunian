import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Play, Trash2 } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { PreventiveSchedule } from '../../services/preventiveMaintenanceService';

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  quarterly: '3 Bulanan',
  biannual: '6 Bulanan',
  annual: 'Tahunan',
  custom: 'Custom',
};

interface Props {
  schedules?: PreventiveSchedule[];
  loading?: boolean;
  onExecute: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function PreventiveScheduleList({ schedules, loading, onExecute, onToggleActive, onDelete }: Props) {
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  if (!schedules?.length) return <p className="text-center text-muted-foreground py-8">Belum ada jadwal preventif</p>;

  const today = new Date();

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tugas</TableHead>
            <TableHead>Properti/Unit</TableHead>
            <TableHead>Frekuensi</TableHead>
            <TableHead>Jadwal Berikut</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Est. Biaya</TableHead>
            <TableHead>Aktif</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map(s => {
            const isOverdue = s.isActive && isBefore(new Date(s.nextScheduledDate), today);
            return (
              <TableRow key={s.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{s.title}</p>
                    <Badge variant="secondary" className="text-xs mt-0.5 capitalize">{s.category}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{s.propertyName || '-'}{s.unitNumber ? ` / ${s.unitNumber}` : ''}</TableCell>
                <TableCell className="text-sm">{FREQ_LABELS[s.frequency] || s.frequency}</TableCell>
                <TableCell>
                  <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                    {format(new Date(s.nextScheduledDate), 'dd MMM yyyy', { locale: idLocale })}
                  </span>
                  {isOverdue && <Badge variant="destructive" className="ml-1 text-xs">Overdue</Badge>}
                </TableCell>
                <TableCell className="text-sm">{s.vendorName || '-'}</TableCell>
                <TableCell className="text-right text-sm">Rp {s.estimatedCost.toLocaleString('id-ID')}</TableCell>
                <TableCell>
                  <Switch checked={s.isActive} onCheckedChange={v => onToggleActive(s.id, v)} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onExecute(s.id)} title="Eksekusi sekarang">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(s.id)} title="Nonaktifkan">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
