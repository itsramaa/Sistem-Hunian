import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/shared/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PaymentRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  method?: string;
  reference?: string;
}

interface PaymentHistoryExportProps {
  payments: PaymentRecord[];
  filename?: string;
}

export function PaymentHistoryExport({ 
  payments, 
  filename = 'payment-history' 
}: PaymentHistoryExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const headers = ['Date', 'Description', 'Amount', 'Status', 'Method', 'Reference'];
      const rows = payments.map(p => [
        format(new Date(p.date), 'yyyy-MM-dd'),
        p.description,
        p.amount.toString(),
        p.status,
        p.method || '-',
        p.reference || '-',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Payment history exported as CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    
    try {
      // Generate HTML for PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment History</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: bold; }
            .amount { text-align: right; }
            .status-paid { color: green; }
            .status-pending { color: orange; }
            .status-overdue { color: red; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Payment History</h1>
          <p>Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th class="amount">Amount</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${format(new Date(p.date), 'MMM d, yyyy')}</td>
                  <td>${p.description}</td>
                  <td class="amount">${formatCurrency(p.amount)}</td>
                  <td class="status-${p.status}">${p.status}</td>
                  <td>${p.reference || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Total Payments: ${payments.length}</p>
            <p>Total Amount: ${formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}</p>
          </div>
        </body>
        </html>
      `;

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      toast.success('Payment history ready to print/save as PDF');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (payments.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
