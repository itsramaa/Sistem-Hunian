import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Button } from '@/shared/components/ui/button';
import { Check, RefreshCw, Image, AlertTriangle, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/shared/components/ui/dialog';
import type { UnmatchedPayment, SuggestedInvoice } from '../services/reconciliationService';

interface Props {
  payment: UnmatchedPayment;
  onManualMatch: (paymentId: string, invoiceId: string, amount: number) => void;
  onAutoMatch: (paymentId: string) => void;
  isMatching: boolean;
}

export function PaymentReviewCard({ payment, onManualMatch, onAutoMatch, isMatching }: Props) {
  const bestMatch = payment.suggestedInvoices?.[0];
  const confidence = bestMatch
    ? bestMatch.totalAmount === payment.amount ? 95 : Math.max(30, 80 - Math.abs(bestMatch.totalAmount - payment.amount) / payment.amount * 100)
    : 0;

  const confidenceColor = confidence >= 90 ? 'text-green-600' : confidence >= 50 ? 'text-amber-600' : 'text-destructive';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment side */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Pembayaran</h4>
              <div className="flex gap-1">
                {payment.flags?.includes('duplicate') && <Badge variant="destructive" className="text-[10px]"><Copy className="h-3 w-3 mr-0.5" />Duplikat</Badge>}
                {payment.flags?.includes('partial') && <Badge variant="secondary" className="text-[10px]">Parsial</Badge>}
                {payment.flags?.includes('overpayment') && <Badge variant="outline" className="text-[10px]">Lebih Bayar</Badge>}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Penyewa</span><span className="font-medium">{payment.tenantName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jumlah</span><span className="font-bold">Rp {payment.amount.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Metode</span><span>{payment.paymentMethod || '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Referensi</span><span className="font-mono text-xs">{payment.reference || '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tanggal</span><span>{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('id-ID') : '-'}</span></div>
            </div>
            {payment.proofPhotoUrl && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full"><Image className="h-3.5 w-3.5 mr-1" />Lihat Bukti</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <img src={payment.proofPhotoUrl} alt="Bukti pembayaran" className="w-full rounded-md" />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Invoice side */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Tagihan Tercocok</h4>
            {bestMatch ? (
              <div className="space-y-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span className="font-mono">{bestMatch.invoiceNumber}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Jumlah</span><span className="font-bold">Rp {bestMatch.totalAmount.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Jatuh Tempo</span><span>{new Date(bestMatch.dueDate).toLocaleDateString('id-ID')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{bestMatch.status}</Badge></div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Keyakinan Cocok</span>
                    <span className={`font-bold ${confidenceColor}`}>{Math.round(confidence)}%</span>
                  </div>
                  <Progress value={confidence} className="h-2" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onManualMatch(payment.id, bestMatch.id, payment.amount)} disabled={isMatching} className="flex-1">
                    <Check className="h-3.5 w-3.5 mr-1" />Cocokkan
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAutoMatch(payment.id)} disabled={isMatching}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="text-sm">Tidak ada tagihan cocok</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => onAutoMatch(payment.id)} disabled={isMatching}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />Auto-match
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
