import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantContracts } from '@/features/contracts/hooks/useMerchantContracts';
import { CreateInvoiceDialog } from '@/features/payments/components/CreateInvoiceDialog';
import { InvoiceDetailsDialog } from '@/features/payments/components/InvoiceDetailsDialog';
import { InvoicesFilters } from '@/features/payments/components/InvoicesFilters';
import { InvoicesStats } from '@/features/payments/components/InvoicesStats';
import { InvoicesTable } from '@/features/payments/components/InvoicesTable';
import { useMerchantInvoices } from '@/features/payments/hooks/useMerchantInvoices';
import { Invoice } from '@/features/payments/types';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function MerchantInvoices() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const { 
    invoices, 
    isLoading, 
    createInvoiceMutation, 
    sendInvoiceMutation, 
    markAsPaidMutation, 
    sendReminderMutation,
    generatePdfMutation
  } = useMerchantInvoices(merchant?.id);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { contracts: allContracts = [] } = useMerchantContracts(merchant?.id);
  const contracts = allContracts.filter(c => c.status === 'active');

  const handleCreateInvoice = async (data: {
    contract_id: string;
    merchant_id: string;
    tenant_user_id: string;
    amount: number;
    tax_amount: number;
    description: string;
    due_date: string;
  }) => {
    try {
      await createInvoiceMutation.mutateAsync(data);
      toast({ title: 'Invoice created successfully' });
      setIsCreateOpen(false);
    } catch (error) {
      toast({ title: 'Failed to create invoice', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await sendInvoiceMutation.mutateAsync({ 
        invoiceId, 
        merchantName: merchant?.business_name || 'Landlord' 
      });
      toast({ title: 'Invoice sent successfully', description: 'Email notification sent to tenant' });
    } catch (error) {
      toast({ title: 'Failed to send invoice', variant: 'destructive' });
    }
  };

  const handleMarkAsPaid = async (invoiceId: string, currentStatus: string) => {
    try {
      await markAsPaidMutation.mutateAsync({ invoiceId, currentStatus });
      toast({ title: 'Invoice marked as paid' });
      setViewInvoice(null);
    } catch (error) {
      toast({ title: 'Failed to update invoice', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSendReminder = async (invoiceId: string, tenantUserId: string) => {
    try {
      await sendReminderMutation.mutateAsync({ invoiceId, tenantUserId });
      toast({ title: 'Reminder sent', description: 'Payment reminder sent to tenant' });
    } catch (error) {
      toast({ title: 'Failed to send reminder', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const downloadInvoicePdf = async (invoiceId: string) => {
    try {
      toast({ title: 'Generating PDF...', description: 'Please wait' });
      const result = await generatePdfMutation.mutateAsync(invoiceId);
      
      // Open HTML in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

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

  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage and track your invoices</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

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
          contracts={contracts}
          merchantId={merchant?.id || ''}
          onCreate={handleCreateInvoice}
          isCreating={createInvoiceMutation.isPending}
        />

        <InvoiceDetailsDialog
          invoice={viewInvoice}
          open={!!viewInvoice}
          onOpenChange={(open) => !open && setViewInvoice(null)}
          onDownload={downloadInvoicePdf}
          onSend={handleSendInvoice}
          onMarkPaid={handleMarkAsPaid}
          onRemind={handleSendReminder}
          isSending={sendInvoiceMutation.isPending}
          isReminding={sendReminderMutation.isPending}
          remindingId={sendReminderMutation.isPending ? sendReminderMutation.variables?.invoiceId : null}
        />
      </div>
    </MerchantLayout>
  );
}
