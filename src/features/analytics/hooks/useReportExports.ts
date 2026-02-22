import { useState } from 'react';
import { format } from 'date-fns';
import { exportToCSV, exportToPDF, generateReportHTML } from '@/shared/utils/exportUtils';
import { logExport } from '@/shared/utils/auditLog';
import { useToast } from '@/shared/hooks/use-toast';
import { formatCurrency } from '@/shared/utils/currency';

interface ExportDeps {
  payments: any[];
  maintenanceRequests: any[];
  totalRevenue: number;
  pendingPayments: number;
  occupancyRate: number;
  propertiesCount: number;
  effectiveDateRange: { from: Date; to: Date };
}

export function useReportExports({
  payments,
  maintenanceRequests,
  totalRevenue,
  pendingPayments,
  occupancyRate,
  propertiesCount,
  effectiveDateRange,
}: ExportDeps) {
  const { toast } = useToast();
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const handleExportPaymentsCSV = async () => {
    setExportLoading('payments-csv');
    try {
      const exportData = payments.map(p => ({
        date: format(new Date(p.created_at), 'yyyy-MM-dd'),
        amount: p.amount,
        status: p.status,
        payment_type: p.payment_type,
        due_date: p.due_date,
        paid_at: p.paid_at || '',
      }));
      exportToCSV(exportData, 'payments_report', [
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'payment_type', label: 'Type' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'paid_at', label: 'Paid At' },
      ]);

      await logExport('analytics', 'csv', exportData.length, {
        type: 'payments',
        dateRange: { from: effectiveDateRange.from?.toISOString(), to: effectiveDateRange.to?.toISOString() },
      });

      toast({ title: 'Export complete', description: `${exportData.length} payment records downloaded as CSV.` });
    } catch {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Failed to export payments. Please try again.' });
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportMaintenanceCSV = async () => {
    setExportLoading('maintenance-csv');
    try {
      const exportData = maintenanceRequests.map(r => ({
        date: format(new Date(r.created_at), 'yyyy-MM-dd'),
        title: r.title,
        category: r.category,
        priority: r.priority,
        status: r.status,
      }));
      exportToCSV(exportData, 'maintenance_report', [
        { key: 'date', label: 'Date' },
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'priority', label: 'Priority' },
        { key: 'status', label: 'Status' },
      ]);

      await logExport('analytics', 'csv', exportData.length, {
        type: 'maintenance',
        dateRange: { from: effectiveDateRange.from?.toISOString(), to: effectiveDateRange.to?.toISOString() },
      });

      toast({ title: 'Export complete', description: `${exportData.length} maintenance records downloaded as CSV.` });
    } catch {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Failed to export maintenance data. Please try again.' });
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportPDF = async () => {
    setExportLoading('pdf');
    try {
      const paymentData = payments.filter(p => p.status === 'paid').map(p => ({
        date: format(new Date(p.paid_at || p.created_at), 'dd MMM yyyy'),
        amount: formatCurrency(Number(p.amount)),
        type: p.payment_type,
        status: p.status,
      }));

      const content = generateReportHTML(
        paymentData,
        [
          { key: 'date', label: 'Date' },
          { key: 'amount', label: 'Amount' },
          { key: 'type', label: 'Type' },
          { key: 'status', label: 'Status' },
        ],
        [
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Pending Payments', value: formatCurrency(pendingPayments) },
          { label: 'Occupancy Rate', value: `${occupancyRate}%` },
          { label: 'Total Properties', value: String(propertiesCount) },
        ]
      );

      exportToPDF('Property Analytics Report', content, 'analytics_report');

      await logExport('analytics', 'pdf', paymentData.length, {
        dateRange: { from: effectiveDateRange.from?.toISOString(), to: effectiveDateRange.to?.toISOString() },
      });

      toast({ title: 'Export complete', description: 'Report opened for printing/saving as PDF.' });
    } catch {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Failed to generate PDF. Please try again.' });
    } finally {
      setExportLoading(null);
    }
  };

  return {
    exportLoading,
    handleExportPaymentsCSV,
    handleExportMaintenanceCSV,
    handleExportPDF,
  };
}
