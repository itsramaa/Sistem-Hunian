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
import { supabase } from '@/lib/integrations/supabase/client';

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
      const query = supabase
        .from('orders')
        .select('order_number, status, total_price, created_at, completed_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (start) {
        query.gte('created_at', start.toISOString());
      }

      const { data: orders, error } = await query;
      if (error) throw error;
      data.orders = orders || [];
    }

    if (options.includeProducts) {
      const { data: products, error } = await supabase
        .from('products')
        .select('name, category, price, is_available, created_at')
        .eq('vendor_id', vendorId);

      if (error) throw error;
      data.products = products || [];
    }

    if (options.includeEarnings) {
      const query = supabase
        .from('vendor_earnings')
        .select('amount, fee_amount, net_amount, status, created_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (start) {
        query.gte('created_at', start.toISOString());
      }

      const { data: earnings, error } = await query;
      if (error) throw error;
      data.earnings = earnings || [];
    }

    return data;
  };

  const generateCSV = (data: Record<string, unknown[]>) => {
    const sections: string[] = [];

    if (data.orders && (data.orders as Array<Record<string, unknown>>).length > 0) {
      const headers = ['Order Number', 'Status', 'Total Price', 'Created At', 'Completed At'];
      const rows = (data.orders as Array<Record<string, unknown>>).map((o) => [
        o.order_number as string,
        o.status as string,
        (o.total_price as number).toString(),
        format(new Date(o.created_at as string), 'yyyy-MM-dd HH:mm'),
        o.completed_at ? format(new Date(o.completed_at as string), 'yyyy-MM-dd HH:mm') : '-',
      ]);
      sections.push('ORDERS\n' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n'));
    }

    if (data.products && (data.products as Array<Record<string, unknown>>).length > 0) {
      const headers = ['Name', 'Category', 'Price', 'Available', 'Created At'];
      const rows = (data.products as Array<Record<string, unknown>>).map((p) => [
        p.name as string,
        p.category as string,
        (p.price as number).toString(),
        p.is_available ? 'Yes' : 'No',
        format(new Date(p.created_at as string), 'yyyy-MM-dd'),
      ]);
      sections.push('PRODUCTS\n' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n'));
    }

    if (data.earnings && (data.earnings as Array<Record<string, unknown>>).length > 0) {
      const headers = ['Gross Amount', 'Fee', 'Net Amount', 'Status', 'Date'];
      const rows = (data.earnings as Array<Record<string, unknown>>).map((e) => [
        (e.amount as number).toString(),
        (e.fee_amount as number).toString(),
        (e.net_amount as number).toString(),
        e.status as string,
        format(new Date(e.created_at as string), 'yyyy-MM-dd'),
      ]);
      sections.push('EARNINGS\n' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n'));
    }

    return sections.join('\n\n');
  };

  const handleExport = async () => {
    const hasSelection = options.includeSales || options.includeOrders || options.includeProducts || options.includeEarnings;
    if (!hasSelection) {
      toast.error('Please select at least one data type to export');
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
        link.download = `vendor-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // For PDF, we'll create a simple text-based export
        const csv = generateCSV(data);
        const blob = new Blob([csv], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vendor-analytics-${format(new Date(), 'yyyy-MM-dd')}.txt`;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast.success('Analytics exported successfully');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to export analytics');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setDialogOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Analytics</DialogTitle>
            <DialogDescription>
              Choose the data and format for your export
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Range */}
            <div className="space-y-3">
              <Label>Date Range</Label>
              <RadioGroup
                value={options.dateRange}
                onValueChange={(v) => setOptions({ ...options, dateRange: v as DateRangeOption })}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7d" id="7d" />
                  <Label htmlFor="7d" className="font-normal">Last 7 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30d" id="30d" />
                  <Label htmlFor="30d" className="font-normal">Last 30 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="90d" id="90d" />
                  <Label htmlFor="90d" className="font-normal">Last 90 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal">All time</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Data Selection */}
            <div className="space-y-3">
              <Label>Include in Export</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orders"
                    checked={options.includeOrders}
                    onCheckedChange={(c) => setOptions({ ...options, includeOrders: !!c })}
                  />
                  <Label htmlFor="orders" className="font-normal">Orders</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="products"
                    checked={options.includeProducts}
                    onCheckedChange={(c) => setOptions({ ...options, includeProducts: !!c })}
                  />
                  <Label htmlFor="products" className="font-normal">Products</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="earnings"
                    checked={options.includeEarnings}
                    onCheckedChange={(c) => setOptions({ ...options, includeEarnings: !!c })}
                  />
                  <Label htmlFor="earnings" className="font-normal">Earnings</Label>
                </div>
              </div>
            </div>

            {/* Format */}
            <div className="space-y-3">
              <Label>Export Format</Label>
              <RadioGroup
                value={options.format}
                onValueChange={(v) => setOptions({ ...options, format: v as ExportFormat })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="font-normal flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="font-normal flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Text Report
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
