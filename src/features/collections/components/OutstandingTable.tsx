import { useState } from 'react';
import { Bell, Search, MoreHorizontal, Banknote, Phone } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { OutstandingInvoice } from '../services/collectionsService';
import { collectionsService } from '../services/collectionsService';
import { InlinePaymentMatchDialog } from './InlinePaymentMatchDialog';

interface Props {
  invoices: OutstandingInvoice[] | undefined;
  loading: boolean;
}

const bucketVariant = (bucket: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (bucket === '> 30 hari') return 'destructive';
  if (bucket === '14-30 hari') return 'destructive';
  if (bucket === '7-14 hari') return 'secondary';
  return 'outline';
};

export function OutstandingTable({ invoices, loading }: Props) {
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [matchInvoice, setMatchInvoice] = useState<OutstandingInvoice | null>(null);

  const filtered = (invoices || []).filter(inv =>
    !search ||
    inv.tenantName.toLowerCase().includes(search.toLowerCase()) ||
    inv.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleReminder = async (inv: OutstandingInvoice) => {
    setSendingId(inv.invoiceId);
    try {
      await collectionsService.sendReminder(inv.invoiceId, inv.tenantUserId);
      toast.success('Pengingat berhasil dikirim');
    } catch {
      toast.error('Gagal mengirim pengingat');
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari unit, tenant, atau nomor tagihan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Penyewa</TableHead>
              <TableHead>No. Tagihan</TableHead>
              <TableHead className="text-right">Tunggakan</TableHead>
              <TableHead className="text-center">Hari</TableHead>
              <TableHead>Bucket</TableHead>
              <TableHead>Terakhir Bayar</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Tidak ada tagihan tertunggak
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(inv => (
                <TableRow key={inv.invoiceId}>
                  <TableCell className="font-medium">{inv.unitNumber}</TableCell>
                  <TableCell>{inv.tenantName}</TableCell>
                  <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-right font-semibold">
                    Rp {inv.outstandingAmount.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-center">{inv.daysOverdue}</TableCell>
                  <TableCell>
                    <Badge variant={bucketVariant(inv.agingBucket)}>{inv.agingBucket}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {inv.lastPaymentDate
                      ? new Date(inv.lastPaymentDate).toLocaleDateString('id-ID')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={sendingId === inv.invoiceId}
                          onClick={() => handleReminder(inv)}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          {sendingId === inv.invoiceId ? 'Mengirim...' : 'Kirim Pengingat'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMatchInvoice(inv)}>
                          <Banknote className="h-4 w-4 mr-2" />
                          Proses Pembayaran
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`tel:`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Hubungi Penyewa
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Inline Payment Match Dialog */}
      {matchInvoice && (
        <InlinePaymentMatchDialog
          invoice={matchInvoice}
          open={!!matchInvoice}
          onOpenChange={(open) => { if (!open) setMatchInvoice(null); }}
        />
      )}
    </div>
  );
}
