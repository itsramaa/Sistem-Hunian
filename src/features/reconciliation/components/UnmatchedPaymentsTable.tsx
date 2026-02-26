import { useState } from 'react';
import { Check, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import type { UnmatchedPayment, SuggestedInvoice } from '../services/reconciliationService';

interface Props {
  payments: UnmatchedPayment[] | undefined;
  loading: boolean;
  onManualMatch: (paymentId: string, invoiceId: string, amount: number) => void;
  onAutoMatch: (paymentId: string) => void;
  isMatching: boolean;
}

function InvoiceSuggestionDialog({ payment, onMatch }: { payment: UnmatchedPayment; onMatch: (invoiceId: string) => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Check className="h-3.5 w-3.5 mr-1" />
          Cocokkan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pilih Tagihan untuk Dicocokkan</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-3">
          Pembayaran: <span className="font-semibold">Rp {payment.amount.toLocaleString('id-ID')}</span> dari {payment.tenantName}
        </p>
        {(!payment.suggestedInvoices || payment.suggestedInvoices.length === 0) ? (
          <p className="text-sm text-muted-foreground">Tidak ada tagihan yang cocok ditemukan.</p>
        ) : (
          <div className="space-y-2">
            {payment.suggestedInvoices.map((inv: SuggestedInvoice) => (
              <Card key={inv.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onMatch(inv.id)}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Rp {inv.totalAmount.toLocaleString('id-ID')} · Jatuh tempo {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inv.totalAmount === payment.amount ? 'default' : 'secondary'}>
                      {inv.totalAmount === payment.amount ? 'Exact' : 'Partial'}
                    </Badge>
                    <Button size="sm">Pilih</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UnmatchedPaymentsTable({ payments, loading, onManualMatch, onAutoMatch, isMatching }: Props) {
  const [search, setSearch] = useState('');

  const filtered = (payments || []).filter(p =>
    !search ||
    p.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Pembayaran Belum Dicocokkan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari tenant atau referensi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Penyewa</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Referensi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Semua pembayaran sudah dicocokkan 🎉
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.tenantName}</TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {p.amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-sm">{p.paymentMethod || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{p.reference || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.reconciliationStatus === 'pending_review' ? 'secondary' : 'outline'}>
                        {p.reconciliationStatus === 'pending_review' ? 'Review' : 'Belum'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <InvoiceSuggestionDialog
                          payment={p}
                          onMatch={(invoiceId) => onManualMatch(p.id, invoiceId, p.amount)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isMatching}
                          onClick={() => onAutoMatch(p.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
