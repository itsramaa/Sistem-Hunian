import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { TrendingUp, Sparkles } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import type { RenewalAlert } from '../../services/renewalService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: RenewalAlert;
  onSubmit: (offer: {
    newRent: number;
    newDuration: number;
    effectiveDate: string;
    terms: string;
  }) => void;
  isSubmitting?: boolean;
  suggestedPrice?: number | null;
}

export function RenewalOfferDialog({ open, onOpenChange, alert, onSubmit, isSubmitting, suggestedPrice }: Props) {
  const [newRent, setNewRent] = useState(alert.rentAmount);
  const [duration, setDuration] = useState(12);
  const [terms, setTerms] = useState('');

  const effectiveDate = alert.endDate;
  const increase = newRent > alert.rentAmount
    ? ((newRent - alert.rentAmount) / alert.rentAmount * 100).toFixed(1)
    : '0';

  const applySuggested = () => {
    if (suggestedPrice) setNewRent(suggestedPrice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Buat Penawaran Perpanjangan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current terms */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Unit:</span> {alert.unitNumber}</p>
            <p><span className="text-muted-foreground">Penyewa:</span> {alert.tenantName || '-'}</p>
            <p><span className="text-muted-foreground">Sewa saat ini:</span> Rp {alert.rentAmount.toLocaleString('id-ID')}/bln</p>
            <p><span className="text-muted-foreground">Berakhir:</span> {format(new Date(alert.endDate), 'dd MMM yyyy')}</p>
          </div>

          {/* AI suggestion */}
          {suggestedPrice && suggestedPrice !== alert.rentAmount && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 text-sm">
                <span className="text-muted-foreground">Rekomendasi AI: </span>
                <span className="font-semibold">Rp {suggestedPrice.toLocaleString('id-ID')}</span>
                <span className="text-muted-foreground"> (+{((suggestedPrice - alert.rentAmount) / alert.rentAmount * 100).toFixed(1)}%)</span>
              </div>
              <Button size="sm" variant="outline" onClick={applySuggested} className="shrink-0 text-xs h-7">
                Terapkan
              </Button>
            </div>
          )}

          {/* New rent */}
          <div className="space-y-2">
            <Label>Sewa Baru (Rp/bulan)</Label>
            <Input
              type="number"
              value={newRent}
              onChange={e => setNewRent(Number(e.target.value))}
              min={0}
            />
            {Number(increase) > 0 && (
              <Badge variant="secondary" className="text-xs">+{increase}% kenaikan</Badge>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Durasi Baru (bulan)</Label>
            <Input
              type="number"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              min={1}
              max={60}
            />
            <p className="text-xs text-muted-foreground">
              Berlaku: {format(new Date(effectiveDate), 'dd MMM yyyy')} - {format(addMonths(new Date(effectiveDate), duration), 'dd MMM yyyy')}
            </p>
          </div>

          {/* Terms */}
          <div className="space-y-2">
            <Label>Catatan / Syarat Tambahan</Label>
            <Textarea
              value={terms}
              onChange={e => setTerms(e.target.value)}
              placeholder="Ketentuan khusus untuk perpanjangan..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button
              className="flex-1"
              disabled={isSubmitting || newRent <= 0}
              onClick={() => onSubmit({ newRent, newDuration: duration, effectiveDate, terms })}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Penawaran'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
