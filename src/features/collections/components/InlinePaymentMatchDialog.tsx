import { useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useInvoiceCandidatePayments } from '../hooks/useInvoiceCandidatePayments';
import { reconciliationService } from '@/features/reconciliation/services/reconciliationService';
import { formatCurrency } from '@/shared/utils/currency';
import type { OutstandingInvoice } from '../services/collectionsService';

interface Props {
  invoice: OutstandingInvoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const confidenceBadgeVariant = (score: number): 'default' | 'secondary' | 'outline' => {
  if (score >= 0.95) return 'default';
  if (score >= 0.80) return 'secondary';
  return 'outline';
};

export function InlinePaymentMatchDialog({ invoice, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [matched, setMatched] = useState(false);

  const { data: candidates, isLoading } = useInvoiceCandidatePayments({
    tenantUserId: invoice.tenantUserId,
    contractId: invoice.contractId,
    merchantId: invoice.merchantId,
    invoiceAmount: invoice.outstandingAmount,
    enabled: open,
  });

  const handleMatch = async (paymentId: string, paymentAmount: number) => {
    setMatchingId(paymentId);
    try {
      await reconciliationService.manualMatch(
        paymentId,
        invoice.invoiceId,
        invoice.merchantId,
        paymentAmount
      );
      setMatched(true);
      toast.success('Pembayaran berhasil dicocokkan');
      queryClient.invalidateQueries({ queryKey: ['collections-summary'] });
      queryClient.invalidateQueries({ queryKey: ['collections-detail'] });
    } catch {
      toast.error('Gagal mencocokkan pembayaran');
    } finally {
      setMatchingId(null);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) setMatched(false);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Proses Pembayaran</DialogTitle>
          <DialogDescription>Cocokkan pembayaran dengan tagihan</DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="rounded-md border p-3 space-y-1 bg-muted/30">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tagihan</span>
            <span className="font-mono text-xs">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Penyewa</span>
            <span>{invoice.tenantName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tunggakan</span>
            <span className="font-semibold">{formatCurrency(invoice.outstandingAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Hari Tertunggak</span>
            <Badge variant="destructive" className="text-xs">{invoice.daysOverdue} hari</Badge>
          </div>
        </div>

        {/* Success State */}
        {matched && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="font-semibold">Pembayaran Berhasil Dicocokkan</p>
            <p className="text-sm text-muted-foreground">Tagihan akan diperbarui secara otomatis</p>
            <Button size="sm" variant="outline" onClick={() => handleClose(false)}>Tutup</Button>
          </div>
        )}

        {/* Candidate List */}
        {!matched && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Pembayaran Kandidat
              {candidates && candidates.length > 0 && (
                <span className="ml-1 text-muted-foreground">({candidates.length} ditemukan)</span>
              )}
            </p>

            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            )}

            {!isLoading && (!candidates || candidates.length === 0) && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Tidak ada pembayaran yang cocok ditemukan untuk penyewa ini
              </div>
            )}

            {!isLoading && candidates && candidates.map(c => (
              <div key={c.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{formatCurrency(c.amount)}</span>
                  <Badge variant={confidenceBadgeVariant(c.confidence)}>
                    {Math.round(c.confidence * 100)}% — {c.confidenceLabel}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Metode: {c.paymentMethod}</span>
                  <span>Ref: {c.reference || '-'}</span>
                  <span>Tanggal: {c.paidAt ? new Date(c.paidAt).toLocaleDateString('id-ID') : '-'}</span>
                  {c.proofPhotoUrl && (
                    <a href={c.proofPhotoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Bukti
                    </a>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={matchingId !== null}
                  onClick={() => handleMatch(c.id, c.amount)}
                >
                  {matchingId === c.id ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Memproses...</>
                  ) : (
                    'Konfirmasi Cocok'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
