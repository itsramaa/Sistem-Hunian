import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/components/ui/table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useBillingStore } from '../hooks/useBillingStore';

const ITEMS_PER_PAGE = 10;

export const InvoiceList: React.FC = () => {
  const { invoices } = useBillingStore();
  const [page, setPage] = useState(1);

  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return invoices.slice(start, start + ITEMS_PER_PAGE);
  }, [invoices, page]);

  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'open': return 'Terbuka';
      case 'void': return 'Dibatalkan';
      case 'uncollectible': return 'Tak Tertagih';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'open': return 'secondary';
      case 'void': return 'destructive';
      case 'uncollectible': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40">
              <TableHead className="uppercase text-xs tracking-wider">ID Faktur</TableHead>
              <TableHead className="uppercase text-xs tracking-wider">Tanggal</TableHead>
              <TableHead className="uppercase text-xs tracking-wider">Jumlah</TableHead>
              <TableHead className="uppercase text-xs tracking-wider">Status</TableHead>
              <TableHead className="text-right uppercase text-xs tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Tidak ada faktur ditemukan
                </TableCell>
              </TableRow>
            ) : (
              paginatedInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-primary/5 transition-colors">
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: id })}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: invoice.currency, maximumFractionDigits: 0 }).format(invoice.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(invoice.status) as any} className="rounded-full">
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="rounded-xl" aria-label={`Unduh faktur ${invoice.id}`}>
                      <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Menampilkan {((page - 1) * ITEMS_PER_PAGE) + 1} sampai {Math.min(page * ITEMS_PER_PAGE, invoices.length)} dari {invoices.length} faktur
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Selanjutnya
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};