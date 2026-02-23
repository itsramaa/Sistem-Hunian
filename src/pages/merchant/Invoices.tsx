import { CreateInvoiceDialog } from '@/features/payments/components/CreateInvoiceDialog';
import { InvoiceDetailsDialog } from '@/features/payments/components/InvoiceDetailsDialog';
import { InvoicesFilters } from '@/features/payments/components/InvoicesFilters';
import { InvoicesStats } from '@/features/payments/components/InvoicesStats';
import { InvoicesTable } from '@/features/payments/components/InvoicesTable';
import { useInvoiceActions } from '@/features/payments/hooks/useInvoiceActions';

import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { TabsPageSkeleton } from '@/shared/components/ui/PageSkeleton';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { FileText, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function MerchantInvoices() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const {
    invoices,
    isLoading,
    activeContracts,
    merchantId,
    isCreateOpen,
    setIsCreateOpen,
    viewInvoice,
    setViewInvoice,
    handleCreateInvoice,
    handleSendInvoice,
    handleMarkAsPaid,
    handleSendReminder,
    downloadInvoicePdf,
    createInvoiceMutation,
    sendInvoiceMutation,
    sendReminderMutation,
  } = useInvoiceActions();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = (invoice.invoice_number.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (invoice.description?.toLowerCase() || '').includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, debouncedSearch, statusFilter]);

  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, page]);

  if (isLoading && invoices.length === 0) {
    return <TabsPageSkeleton statsCount={4} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Invoices" description="Manage and track your invoices">
        <Button onClick={() => setIsCreateOpen(true)} className="gradient-cta rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </PageHeader>

      <InvoicesStats invoices={invoices} />

      <InvoicesFilters
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <InvoicesTable 
        invoices={paginatedInvoices} 
        isLoading={isLoading}
        onView={setViewInvoice}
        onDownload={downloadInvoicePdf}
        onSend={handleSendInvoice}
        onRemind={handleSendReminder}
        sendingId={sendInvoiceMutation.isPending ? sendInvoiceMutation.variables?.invoiceId : null}
        remindingId={sendReminderMutation.isPending ? sendReminderMutation.variables?.invoiceId : null}
        page={page}
        totalPages={Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE)}
        totalInvoices={filteredInvoices.length}
        onPageChange={setPage}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      <CreateInvoiceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        contracts={activeContracts}
        merchantId={merchantId}
        onCreate={handleCreateInvoice}
        isCreating={createInvoiceMutation.isPending}
      />

      <InvoiceDetailsDialog
        invoice={viewInvoice}
        open={!!viewInvoice}
        onOpenChange={(open) => !open && setViewInvoice(null)}
        onSend={handleSendInvoice}
        onMarkPaid={handleMarkAsPaid}
        onRemind={handleSendReminder}
        isSending={sendInvoiceMutation.isPending}
        isReminding={sendReminderMutation.isPending}
        remindingId={sendReminderMutation.isPending ? sendReminderMutation.variables?.invoiceId : null}
      />
    </div>
  );
}
