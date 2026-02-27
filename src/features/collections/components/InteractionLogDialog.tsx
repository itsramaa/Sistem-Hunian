import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Plus } from 'lucide-react';
import { useAddInteraction } from '../hooks/useCollectionsInteractions';

interface Props {
  caseId: string;
  trigger?: React.ReactNode;
}

export function InteractionLogDialog({ caseId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const addInteraction = useAddInteraction();

  const [form, setForm] = useState({
    interactionType: 'call',
    direction: 'outbound',
    outcome: '',
    notes: '',
    contactPerson: '',
    followUpDate: '',
  });

  const handleSubmit = () => {
    addInteraction.mutate({
      caseId,
      ...form,
      followUpDate: form.followUpDate || null,
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ interactionType: 'call', direction: 'outbound', outcome: '', notes: '', contactPerson: '', followUpDate: '' });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Log Interaksi</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Interaksi Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Select value={form.interactionType} onValueChange={v => setForm(f => ({ ...f, interactionType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Telepon</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="visit">Kunjungan</SelectItem>
                  <SelectItem value="letter">Surat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Arah</Label>
              <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Keluar</SelectItem>
                  <SelectItem value="inbound">Masuk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Hasil</Label>
            <Select value={form.outcome} onValueChange={v => setForm(f => ({ ...f, outcome: v }))}>
              <SelectTrigger><SelectValue placeholder="Pilih hasil..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="answered">Dijawab</SelectItem>
                <SelectItem value="no_answer">Tidak Dijawab</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="promise_to_pay">Janji Bayar</SelectItem>
                <SelectItem value="refused">Menolak</SelectItem>
                <SelectItem value="escalated">Dieskalasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kontak</Label>
            <Input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="Nama orang yang dihubungi" />
          </div>
          <div className="space-y-1.5">
            <Label>Catatan</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Detail percakapan..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Tanggal Follow-up</Label>
            <Input type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
          </div>
          <Button onClick={handleSubmit} disabled={addInteraction.isPending} className="w-full">
            {addInteraction.isPending ? 'Menyimpan...' : 'Simpan Interaksi'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
