import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ArrowRight, Check, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { ContractAmendment } from '../../services/renewalService';

interface Props {
  amendment: ContractAmendment & {
    merchantOffer?: { newRent: number; newDuration: number; terms?: string };
    negotiationStatus?: string;
  };
  currentRent: number;
  onAccept: (id: string) => void;
  onCounter: (id: string, counterOffer: { newRent: number; notes: string }) => void;
  onDecline: (id: string) => void;
  isLoading?: boolean;
}

export function TenantRenewalResponse({ amendment, currentRent, onAccept, onCounter, onDecline, isLoading }: Props) {
  const [showCounter, setShowCounter] = useState(false);
  const [counterRent, setCounterRent] = useState(amendment.merchantOffer?.newRent || currentRent);
  const [counterNotes, setCounterNotes] = useState('');

  const offer = amendment.merchantOffer;
  if (!offer) return null;

  return (
    <>
      <Card className="rounded-xl border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Penawaran Perpanjangan</CardTitle>
            <Badge variant="secondary">
              {amendment.negotiationStatus === 'merchant_proposed' ? 'Menunggu Respon' : amendment.negotiationStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground text-xs">Sewa Saat Ini</p>
              <p className="font-semibold">Rp {currentRent.toLocaleString('id-ID')}</p>
            </div>
            <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
              <p className="text-muted-foreground text-xs">Penawaran Baru</p>
              <div className="flex items-center gap-1">
                <p className="font-semibold">Rp {offer.newRent.toLocaleString('id-ID')}</p>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Durasi:</span> {offer.newDuration} bulan</p>
            {offer.terms && <p><span className="text-muted-foreground">Catatan:</span> {offer.terms}</p>}
            <p><span className="text-muted-foreground">Mulai:</span> {format(new Date(amendment.effectiveDate || ''), 'dd MMM yyyy')}</p>
          </div>

          {amendment.negotiationStatus === 'merchant_proposed' && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive"
                onClick={() => onDecline(amendment.id)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" /> Tolak
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowCounter(true)}
                disabled={isLoading}
              >
                <MessageSquare className="h-4 w-4 mr-1" /> Counter
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAccept(amendment.id)}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-1" /> Terima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCounter} onOpenChange={setShowCounter}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Counter-Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sewa yang Anda Usulkan (Rp/bulan)</Label>
              <Input
                type="number"
                value={counterRent}
                onChange={e => setCounterRent(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Alasan / Catatan</Label>
              <Textarea
                value={counterNotes}
                onChange={e => setCounterNotes(e.target.value)}
                placeholder="Jelaskan alasan counter-offer Anda..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCounter(false)}>Batal</Button>
              <Button
                className="flex-1"
                disabled={isLoading || counterRent <= 0}
                onClick={() => {
                  onCounter(amendment.id, { newRent: counterRent, notes: counterNotes });
                  setShowCounter(false);
                }}
              >
                Kirim Counter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
