import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, subMonths } from 'date-fns';
import { apiClient } from '@/lib/axios';

interface AnalyticsExportProps {
  vendorId: string;
}

type DateRangeOption = '7d' | '30d' | '90d' | 'all';
type ExportFormat = 'csv' | 'pdf';

interface ExportOptions {
  dateRange: DateRangeOption;
  format: ExportFormat;
  includeSales: boolean;
  includeOrders: boolean;
  includeProducts: boolean;
  includeEarnings: boolean;
}

export function AnalyticsExport({ vendorId }: AnalyticsExportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    dateRange: '30d',
    format: 'csv',
    includeSales: true,
    includeOrders: true,
    includeProducts: true,
    includeEarnings: true,
  });

  const getDateRange = (range: DateRangeOption): { start: Date | null; end: Date } => {
    const end = new Date();
    switch (range) {
      case '7d': return { start: subDays(end, 7), end };
      case '30d': return { start: subDays(end, 30), end };
      case '90d': return { start: subDays(end, 90), end };
      default: return { start: null, end };
    }
  };

  const fetchData = async () => {
    const { start, end } = getDateRange(options.dateRange);
    const data: Record<string, unknown[]> = {};

    if (options.includeOrders) {
      const params: Record<string, unknown> = {
        select: 'order_number,status,total_price,created_at,completed_at',
        vendor_id: vendorId,
        order: 'created_at.desc',
      };
      if (start) params['created_at'] = `gte.${start.toISOString()}`;
      const { data: orders } = await apiClient.get('/orders', { params });
      data.orders = orders || [];
    }

    if (options.includeProducts) {
      const { data: products } = await apiClient.get('/products', {
        params: { select: 'name,category,price,is_available,created_at', vendor_id: vendorId },
      });
      data.products = products || [];
    }

    if (options.includeEarnings) {
      const params: Record<string, unknown> = {
        select: 'amount,fee_amount,net_amount,status,created_at',
        vendor_id: vendorId,
        order: 'created_at.desc',
      };
      if (start) params['created_at'] = `gte.${start.toISOString()}`;
      const { data: earnings } = await apiClient.get('/vendor-earnings', { params });
      data.earnings = earnings || [];
    }

    return data;
  };

  const generateCSV = (data: Record<string, unknown[]>) => {
    const sections: string[] = [];

    if (data.orders && (data.orders as Array<Record<string, unknown>>).length > 0) {
      const headers = ['Nomor Pesanan', 'Status', 'Total Harga', 'Dibuat Pada', 'Selesai Pada'];
      const rows = (data.orders as Array<Record<string, unknown>>).map((o) => [
        o.order_number as string,
        o.status as string,
        (o.total_price as number).toString(),
        format(new Date(o.created_at as string), 'yyyy-MM-dd HH:mm'),
        o.completed_at ? format(new Date(o.completed_at as string), 'yyyy-MM-dd HH:mm') : '-',
      ]);
      sections.push('PESANAN\n' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n'));
    }

    if (data.products && (data.products as Array<Record<string, unknown>>).length > 0) {
      const headers = ['Nama', 'Kategori', 'Harga', 'Tersedia', 'Dibuat Pada'];
      const rows = (data.products as Array<Record<string, unknown>>).map((p) => [
        p.name as string,
        p.category as string,
        (p.price as number).toString(),
        p.is_available ? 'Ya' : 'Tidak',
        format(new Date(p.created_at as string), 'yyyy-MM-dd'),
      ]);
      sections.push('PRODUK\n' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n'));
    }

    if (data.earnings && (data.earnings as Array<Record<string, unknown>>).length > 0) {
      const headers = ['Jumlah Bruto', 'Biaya', 'Jumlah Neto', 'Status', 'Tanggal'];
      const rows = (data.earnings as Array<Record<string, unknown>>).map((e) => [
        (e.amount as number).toString(),
        (e.fee_amount as number).toString(),
        (e.net_amount as number).toString(),
        e.status as string,
        format(new Date(e.created_at as string), 'yyyy-MM-dd'),
      ]);
      sections.push('PENGHASILAN\n' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n'));
    }

    return sections.join('\n\n');
  };

  const handleExport = async () => {
    const hasSelection = options.includeSales || options.includeOrders || options.includeProducts || options.includeEarnings;
    if (!hasSelection) {
      toast.error('Silakan pilih setidaknya satu tipe data untuk diekspor');
      return;
    }

    setIsExporting(true);
    try {
      const data = await fetchData();

      if (options.format === 'csv') {
        const csv = generateCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analisis-vendor-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // For PDF, we'll create a simple text-based export
        const csv = generateCSV(data);
        const blob = new Blob([csv], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analisis-vendor-${format(new Date(), 'yyyy-MM-dd')}.txt`;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast.success('Analisis berhasil diekspor');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Gagal mengekspor analisis');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setDialogOpen(true)}>
        <Download className="h-4 w-4 mr-2" aria-hidden="true" />
        Ekspor
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby="export-description">
          <DialogHeader>
            <DialogTitle>Ekspor Analisis</DialogTitle>
            <DialogDescription id="export-description">
              Pilih data dan format untuk ekspor Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Range */}
            <div className="space-y-3">
              <Label>Rentang Waktu</Label>
              <RadioGroup
                value={options.dateRange}
                onValueChange={(v) => setOptions({ ...options, dateRange: v as DateRangeOption })}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7d" id="7d" />
                  <Label htmlFor="7d" className="font-normal">7 hari terakhir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30d" id="30d" />
                  <Label htmlFor="30d" className="font-normal">30 hari terakhir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="90d" id="90d" />
                  <Label htmlFor="90d" className="font-normal">90 hari terakhir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal">Semua waktu</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Data Selection */}
            <div className="space-y-3">
              <Label>Sertakan dalam Ekspor</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orders"
                    checked={options.includeOrders}
                    onCheckedChange={(c) => setOptions({ ...options, includeOrders: !!c })}
                  />
                  <Label htmlFor="orders" className="font-normal">Pesanan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="products"
                    checked={options.includeProducts}
                    onCheckedChange={(c) => setOptions({ ...options, includeProducts: !!c })}
                  />
                  <Label htmlFor="products" className="font-normal">Produk</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="earnings"
                    checked={options.includeEarnings}
                    onCheckedChange={(c) => setOptions({ ...options, includeEarnings: !!c })}
                  />
                  <Label htmlFor="earnings" className="font-normal">Penghasilan</Label>
                </div>
              </div>
            </div>

            {/* Format */}
            <div className="space-y-3">
              <Label>Format Ekspor</Label>
              <RadioGroup
                value={options.format}
                onValueChange={(v) => setOptions({ ...options, format: v as ExportFormat })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="font-normal flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                    CSV
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="font-normal flex items-center gap-1">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Laporan Teks
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  Ekspor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
