import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { useCreateScreening } from '../hooks/useScreening';
import { ScreeningFormData } from '../types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenants?: { user_id: string; full_name: string }[];
}

const STEPS = ['Info Pribadi', 'Riwayat Sewa', 'Penjamin'];

export function TenantScreeningForm({ open, onOpenChange, tenants }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ScreeningFormData>({
    candidate_name: '', candidate_email: '', candidate_phone: '',
    occupation: '', employer_name: '', monthly_income: 0,
    previous_landlord_name: '', previous_landlord_phone: '', previous_rental_notes: '',
    guarantor_name: '', guarantor_phone: '', guarantor_relation: '',
  });

  const createMutation = useCreateScreening();

  const set = (key: keyof ScreeningFormData, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.candidate_name.trim()) { toast.error('Nama wajib diisi'); return; }
    createMutation.mutate(form, {
      onSuccess: () => {
        toast.success('Screening selesai — skor telah dihitung');
        onOpenChange(false);
        setStep(0);
        setForm({ candidate_name: '', candidate_email: '', candidate_phone: '', occupation: '', employer_name: '', monthly_income: 0, previous_landlord_name: '', previous_landlord_phone: '', previous_rental_notes: '', guarantor_name: '', guarantor_phone: '', guarantor_relation: '' });
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Screening Penyewa Baru</DialogTitle>
          <DialogDescription>Langkah {step + 1}/3: {STEPS[step]}</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <div className="space-y-4 py-2">
          {step === 0 && (
            <>
              {tenants && tenants.length > 0 && (
                <div>
                  <Label>Penyewa Terdaftar (opsional)</Label>
                  <Select onValueChange={(v) => {
                    const t = tenants.find(t => t.user_id === v);
                    if (t) { set('tenant_user_id', v); set('candidate_name', t.full_name); }
                  }}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih atau isi manual" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {tenants.map(t => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>Nama Lengkap *</Label><Input value={form.candidate_name} onChange={e => set('candidate_name', e.target.value)} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={form.candidate_email} onChange={e => set('candidate_email', e.target.value)} className="rounded-xl" /></div>
                <div><Label>Telepon</Label><Input value={form.candidate_phone} onChange={e => set('candidate_phone', e.target.value)} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Pekerjaan</Label><Input value={form.occupation} onChange={e => set('occupation', e.target.value)} className="rounded-xl" /></div>
                <div><Label>Nama Perusahaan</Label><Input value={form.employer_name} onChange={e => set('employer_name', e.target.value)} className="rounded-xl" /></div>
              </div>
              <div><Label>Pendapatan Bulanan (Rp)</Label><Input type="number" value={form.monthly_income || ''} onChange={e => set('monthly_income', Number(e.target.value))} className="rounded-xl" /></div>
            </>
          )}

          {step === 1 && (
            <>
              <div><Label>Nama Pemilik Sewa Sebelumnya</Label><Input value={form.previous_landlord_name} onChange={e => set('previous_landlord_name', e.target.value)} className="rounded-xl" /></div>
              <div><Label>Telepon Pemilik Sebelumnya</Label><Input value={form.previous_landlord_phone} onChange={e => set('previous_landlord_phone', e.target.value)} className="rounded-xl" /></div>
              <div><Label>Catatan Riwayat Sewa</Label><Textarea value={form.previous_rental_notes} onChange={e => set('previous_rental_notes', e.target.value)} rows={3} className="rounded-xl" /></div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">Penjamin diperlukan jika skor risiko tinggi (merah).</p>
              <div><Label>Nama Penjamin</Label><Input value={form.guarantor_name} onChange={e => set('guarantor_name', e.target.value)} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Telepon Penjamin</Label><Input value={form.guarantor_phone} onChange={e => set('guarantor_phone', e.target.value)} className="rounded-xl" /></div>
                <div><Label>Hubungan</Label><Input value={form.guarantor_relation} onChange={e => set('guarantor_relation', e.target.value)} className="rounded-xl" placeholder="Orang tua, Saudara, dll" /></div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="outline" className="rounded-xl" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)}>
            {step > 0 ? 'Kembali' : 'Batal'}
          </Button>
          {step < 2 ? (
            <Button className="gradient-cta rounded-xl" onClick={() => setStep(step + 1)}>Lanjut</Button>
          ) : (
            <Button className="gradient-cta rounded-xl" disabled={createMutation.isPending} onClick={handleSubmit}>
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Memproses...</> : 'Jalankan Screening'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
