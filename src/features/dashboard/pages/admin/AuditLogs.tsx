import { AuditLogFilters } from '@/features/audit-logs/components/admin/AuditLogFilters';
import { AuditLogTable } from '@/features/audit-logs/components/admin/AuditLogTable';
import { useAuditLogs } from '@/features/audit-logs/hooks/useAuditLogs';
import { useAdminGuard } from '@/features/auth/hooks/useAdminGuard';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { logExport } from '@/shared/utils/auditLog';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

const PAGE_SIZE = 50;

export default function AuditLogs() {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { logsData, isLoading } = useAuditLogs({
    action: actionFilter,
    entityType: entityFilter,
    dateRange: dateRange ? { from: dateRange.from, to: dateRange.to } : undefined,
    page,
    pageSize: PAGE_SIZE,
  }, isAdmin);

  const handleExport = () => {
    toast.success("Ekspor dimulai");
    logExport("audit_log", "csv", 0);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setEntityFilter('all');
    setDateRange(undefined);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleActionFilterChange = (value: string) => {
    setActionFilter(value);
    setPage(1);
  };

  const handleEntityFilterChange = (value: string) => {
    setEntityFilter(value);
    setPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  if (guardLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Log Audit"
      description="Lacak dan pantau semua aktivitas dan perubahan sistem"
      actions={
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Ekspor Log
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Sistem</CardTitle>
            <CardDescription>
              Filter dan cari melalui log audit sistem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLogFilters
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              actionFilter={actionFilter}
              onActionFilterChange={handleActionFilterChange}
              entityFilter={entityFilter}
              onEntityFilterChange={handleEntityFilterChange}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              onResetFilters={handleResetFilters}
            />
            
            <AuditLogTable
              logs={logsData?.data || []}
              isLoading={isLoading}
              page={page}
              totalPages={Math.ceil((logsData?.count || 0) / PAGE_SIZE)}
              onPageChange={setPage}
              itemsPerPage={PAGE_SIZE}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
