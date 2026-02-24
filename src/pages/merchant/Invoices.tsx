import { CreateInvoiceDialog } from '@/features/payments/components/CreateInvoiceDialog';
import { InvoiceDetailsDialog } from '@/features/payments/components/InvoiceDetailsDialog';
import { InvoicesFilters } from '@/features/payments/components/InvoicesFilters';
import { InvoicesStats } from '@/features/payments/components/InvoicesStats';
import { InvoicesTable } from '@/features/payments/components/InvoicesTable';
import { useInvoiceActions } from '@/features/payments/hooks/useInvoiceActions';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { TabsPageSkeleton } from '@/shared/components/ui/PageSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { FileText, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function MerchantInvoices() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

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
  }, [debouncedSearch, statusFilter, activeTab]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = (invoice.invoice_number.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        (invoice.description?.toLowerCase() || '').includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesTab = activeTab === 'all' || invoice.status === activeTab;
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [invoices, debouncedSearch, statusFilter, activeTab]);

  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, page]);

  // Tab counts
  const statusCounts = useMemo(() => {
    const counts = { draft: 0, sent: 0, paid: 0, overdue: 0 };
    invoices.forEach(inv => {
      if (inv.status in counts) counts[inv.status as keyof typeof counts]++;
    });
    return counts;
  }, [invoices]);

  if (isLoading && invoices.length === 0) {
    return <TabsPageSkeleton statsCount={4} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Faktur" description="Kelola dan lacak faktur Anda">
        <Button onClick={() => setIsCreateOpen(true)} className="gradient-cta rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Buat Faktur
        </Button>
      </PageHeader>

      <InvoicesStats invoices={invoices} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list">
          <TabsTrigger value="all" className="pill-tab-trigger">Semua ({invoices.length})</TabsTrigger>
          <TabsTrigger value="draft" className="pill-tab-trigger">Draf ({statusCounts.draft})</TabsTrigger>
          <TabsTrigger value="sent" className="pill-tab-trigger">Terkirim ({statusCounts.sent})</TabsTrigger>
          <TabsTrigger value="paid" className="pill-tab-trigger">Lunas ({statusCounts.paid})</TabsTrigger>
          <TabsTrigger value="overdue" className="pill-tab-trigger">
            Jatuh Tempo
            {statusCounts.overdue > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">{statusCounts.overdue}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <InvoicesFilters
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          <div className="mt-4">
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
          </div>
        </TabsContent>
      </Tabs>

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