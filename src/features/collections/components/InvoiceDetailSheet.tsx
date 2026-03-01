import { useState } from 'react';
import { Bell, CheckCircle2, ExternalLink, Loader2, Phone } from 'lucide-react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/shared/components/ui/sheet';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Separator } from '@/shared/components/ui/separator';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useInvoiceCandidatePayments } from '../hooks/useInvoiceCandidatePayments';
import { reconciliationService } from '@/features/reconciliation/services/reconciliationService';
import { collectionsService } from '../services/collectionsService';
import { formatCurrency } from '@/shared/utils/currency';
import type { OutstandingInvoice } from '../services/collectionsService';

interface Props {
  invoice: OutstandingInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const confidenceBadgeVariant = (score: number): 'default' | 'secondary' | 'outline' => {
  if (score >= 0.95) return 'default';
  if (score >= 0.80) return 'secondary';
  return 'outline';
};

export function InvoiceDetailSheet({ invoice, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [matched, setMatched] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  const { data: candidates, isLoading: candidatesLoading } = useInvoiceCandidatePayments({
    tenantUserId: invoice?.tenantUserId ?? '',
    contractId: invoice?.contractId ?? '',
    merchantId: invoice?.merchantId ?? '',
    invoiceAmount: invoice?.outstandingAmount ?? 0,
    enabled: open && !!invoice,
  });

  const handleMatch = async (paymentId: string, paymentAmount: number) => {
    if (!invoice) return;
    setMatchingId(paymentId);
    try {
      await reconciliationService.manualMatch(paymentId, invoice.invoiceId, invoice.merchantId, paymentAmount);
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

  const handleReminder = async () => {
    if (!invoice) return;
    setSendingReminder(true);
    try {
      await collectionsService.sendReminder(invoice.invoiceId, invoice.tenantUserId);
      toast.success('Pengingat berhasil dikirim');
    } catch {
      toast.error('Gagal mengirim pengingat');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) setMatched(false);
    onOpenChange(val);
  };

  if (!invoice) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>Detail Tagihan</SheetTitle>
          <SheetDescription className="font-mono text-xs">{invoice.invoiceNumber}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-5">
            {/* Section 1: Invoice Summary */}
            <div className="rounded-md border p-4 space-y-2 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unit</span>
                <span className="font-medium">{invoice.unitNumber}</span>
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
                <span className="text-muted-foreground">Total Tagihan</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sudah Dibayar</span>
                <span>{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Hari Tertunggak</span>
                <Badge variant="destructive" className="text-xs">{invoice.daysOverdue} hari</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jatuh Tempo</span>
                <span>{new Date(invoice.dueDate).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Terakhir Bayar</span>
                <span>{invoice.lastPaymentDate ? new Date(invoice.lastPaymentDate).toLocaleDateString('id-ID') : '-'}</span>
              </div>
            </div>

            {/* Section 2: Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={sendingReminder}
                onClick={handleReminder}
              >
                {sendingReminder ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Mengirim...</>
                ) : (
                  <><Bell className="h-3.5 w-3.5 mr-1" /> Kirim Pengingat</>
                )}
              </Button>
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href="tel:">
                  <Phone className="h-3.5 w-3.5 mr-1" /> Hubungi Penyewa
                </a>
              </Button>
            </div>

            <Separator />

            {/* Section 3: Payment Matching */}
            {matched ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
                <p className="font-semibold">Pembayaran Berhasil Dicocokkan</p>
                <p className="text-sm text-muted-foreground">Tagihan akan diperbarui secara otomatis</p>
                <Button size="sm" variant="outline" onClick={() => handleClose(false)}>Tutup</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Pembayaran Kandidat
                  {candidates && candidates.length > 0 && (
                    <span className="ml-1 text-muted-foreground">({candidates.length} ditemukan)</span>
                  )}
                </p>

                {candidatesLoading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                )}

                {!candidatesLoading && (!candidates || candidates.length === 0) && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Tidak ada pembayaran yang cocok ditemukan
                  </div>
                )}

                {!candidatesLoading && candidates?.map(c => (
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
