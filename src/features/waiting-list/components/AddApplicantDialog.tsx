import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import type { CreateApplicantPayload } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Omit<CreateApplicantPayload, 'merchantId'>) => void;
  loading?: boolean;
}

export function AddApplicantDialog({ open, onOpenChange, onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    applicantName: '',
    applicantPhone: '',
    applicantEmail: '',
    budgetMin: '',
    budgetMax: '',
    preferredMoveIn: '',
    specialNeeds: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      applicantName: form.applicantName,
      applicantPhone: form.applicantPhone || undefined,
      applicantEmail: form.applicantEmail || undefined,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      preferredMoveIn: form.preferredMoveIn || undefined,
      specialNeeds: form.specialNeeds || undefined,
      notes: form.notes || undefined,
    });
    setForm({ applicantName: '', applicantPhone: '', applicantEmail: '', budgetMin: '', budgetMax: '', preferredMoveIn: '', specialNeeds: '', notes: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Tambah Pelamar Baru</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Nama *</Label><Input required value={form.applicantName} onChange={e => setForm(f => ({ ...f, applicantName: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Telepon</Label><Input value={form.applicantPhone} onChange={e => setForm(f => ({ ...f, applicantPhone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={form.applicantEmail} onChange={e => setForm(f => ({ ...f, applicantEmail: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Budget Min</Label><Input type="number" value={form.budgetMin} onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))} /></div>
            <div><Label>Budget Max</Label><Input type="number" value={form.budgetMax} onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))} /></div>
          </div>
          <div><Label>Tanggal Pindah</Label><Input type="date" value={form.preferredMoveIn} onChange={e => setForm(f => ({ ...f, preferredMoveIn: e.target.value }))} /></div>
          <div><Label>Kebutuhan Khusus</Label><Textarea value={form.specialNeeds} onChange={e => setForm(f => ({ ...f, specialNeeds: e.target.value }))} rows={2} /></div>
          <div><Label>Catatan</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          <DialogFooter><Button type="submit" disabled={loading || !form.applicantName}>Simpan</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
