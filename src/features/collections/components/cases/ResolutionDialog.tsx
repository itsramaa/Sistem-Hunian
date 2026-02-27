import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

const RESOLUTION_TYPES = [
  { value: 'paid_in_full', label: 'Dibayar Lunas' },
  { value: 'payment_plan', label: 'Rencana Cicilan' },
  { value: 'write_off', label: 'Dihapuskan (Write-off)' },
  { value: 'eviction', label: 'Pengusiran' },
  { value: 'bad_debt', label: 'Piutang Macet' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (resolution: string) => void;
  isPending?: boolean;
}

export function ResolutionDialog({ open, onOpenChange, onConfirm, isPending }: Props) {
  const [resolution, setResolution] = useState('paid_in_full');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selesaikan Kasus</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipe Penyelesaian</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESOLUTION_TYPES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => onConfirm(resolution)} disabled={isPending} className="w-full">
            {isPending ? 'Memproses...' : 'Konfirmasi Penyelesaian'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
