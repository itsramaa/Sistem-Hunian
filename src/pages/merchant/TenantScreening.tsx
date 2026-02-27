import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { useScreenings } from '@/features/screening/hooks/useScreening';
import { TenantScreeningForm } from '@/features/screening/components/TenantScreeningForm';
import { ScreeningTable } from '@/features/screening/components/ScreeningTable';
import { ScreeningScoreCard } from '@/features/screening/components/ScreeningScoreCard';
import { ScreeningApprovalActions } from '@/features/screening/components/ScreeningApprovalActions';
import { TenantScreening as TenantScreeningType } from '@/features/screening/types';
import { Loader2, Plus, ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

export default function TenantScreeningPage() {
  const { data: screenings, isLoading } = useScreenings();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<TenantScreeningType | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = (screenings ?? []).filter(s => {
    if (gradeFilter !== 'all' && s.screening_grade !== gradeFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Screening Penyewa</h1>
          <p className="text-sm text-muted-foreground">Pre-screening wajib sebelum pembuatan kontrak</p>
        </div>
        <Button className="gradient-cta rounded-xl" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Screening Baru
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Grade" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Grade</SelectItem>
            <SelectItem value="green">Green</SelectItem>
            <SelectItem value="yellow">Yellow</SelectItem>
            <SelectItem value="red">Red</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="scored">Dinilai</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <ScreeningTable screenings={filtered} onSelect={setSelected} />
      )}

      <TenantScreeningForm open={formOpen} onOpenChange={setFormOpen} />

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detail Screening — {selected?.candidate_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Pekerjaan:</span> {selected.occupation || '-'}</div>
                <div><span className="text-muted-foreground">Perusahaan:</span> {selected.employer_name || '-'}</div>
                <div><span className="text-muted-foreground">Pendapatan:</span> {selected.monthly_income ? `Rp ${selected.monthly_income.toLocaleString('id-ID')}` : '-'}</div>
                <div><span className="text-muted-foreground">Telepon:</span> {selected.candidate_phone || '-'}</div>
              </div>
              {selected.previous_landlord_name && (
                <Card className="rounded-xl">
                  <CardHeader className="pb-1"><CardTitle className="text-sm">Riwayat Sewa</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>Pemilik: {selected.previous_landlord_name} ({selected.previous_landlord_phone || '-'})</p>
                    <p>{selected.previous_rental_notes || '-'}</p>
                  </CardContent>
                </Card>
              )}
              {selected.guarantor_name && (
                <Card className="rounded-xl">
                  <CardHeader className="pb-1"><CardTitle className="text-sm">Penjamin</CardTitle></CardHeader>
                  <CardContent className="text-sm">
                    <p>{selected.guarantor_name} — {selected.guarantor_relation} ({selected.guarantor_phone})</p>
                  </CardContent>
                </Card>
              )}
              <ScreeningScoreCard screening={selected} />
              <ScreeningApprovalActions screening={selected} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
