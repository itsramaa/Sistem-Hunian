import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  merchantId: string;
  currentRent: number;
  onSubmit: (payload: any) => void;
  loading?: boolean;
}

const typeLabels: Record<string, string> = {
  rent_adjustment: 'Penyesuaian Sewa',
  lease_extension: 'Perpanjangan Sewa',
  term_modification: 'Perubahan Ketentuan',
};

export function CreateAmendmentDialog({ open, onOpenChange, contractId, merchantId, currentRent, onSubmit, loading }: Props) {
  const [type, setType] = useState('rent_adjustment');
  const [newRent, setNewRent] = useState(String(currentRent));
  const [effectiveDate, setEffectiveDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      contractId,
      merchantId,
      amendmentType: type,
      oldValues: { rent_amount: currentRent },
      newValues: type === 'rent_adjustment' ? { rent_amount: Number(newRent) } : { notes },
      effectiveDate: effectiveDate || undefined,
      notes: notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Buat Amandemen Kontrak</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Jenis Amandemen</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {type === 'rent_adjustment' && (
            <div>
              <Label>Sewa Baru (Rp)</Label>
              <Input type="number" value={newRent} onChange={e => setNewRent(e.target.value)} required />
              <p className="text-xs text-muted-foreground mt-1">Sewa saat ini: Rp {currentRent.toLocaleString('id-ID')}</p>
            </div>
          )}
          <div><Label>Tanggal Efektif</Label><Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} /></div>
          <div><Label>Catatan</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
          <DialogFooter><Button type="submit" disabled={loading}>Buat Amandemen</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
