import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { TenantScreening } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const gradeColors: Record<string, string> = {
  green: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  yellow: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  red: 'bg-destructive/15 text-destructive border-destructive/30',
};

const statusLabels: Record<string, string> = {
  pending: 'Menunggu',
  scored: 'Dinilai',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

interface Props {
  screenings: TenantScreening[];
  onSelect: (s: TenantScreening) => void;
}

export function ScreeningTable({ screenings, onSelect }: Props) {
  if (!screenings.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">Belum ada data screening.</p>;
  }

  return (
    <div className="rounded-2xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Pekerjaan</TableHead>
            <TableHead>Pendapatan</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {screenings.map(s => (
            <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(s)}>
              <TableCell className="font-medium">{s.candidate_name}</TableCell>
              <TableCell>{s.occupation || '-'}</TableCell>
              <TableCell>{s.monthly_income ? `Rp ${s.monthly_income.toLocaleString('id-ID')}` : '-'}</TableCell>
              <TableCell>
                {s.screening_grade ? (
                  <Badge variant="outline" className={`rounded-lg ${gradeColors[s.screening_grade] || ''}`}>
                    {s.screening_grade.toUpperCase()}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>{statusLabels[s.status] || s.status}</TableCell>
              <TableCell>{format(new Date(s.created_at), 'dd MMM yyyy', { locale: id })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
