import { useAuth } from '@/features/auth/hooks/useAuth';
import { MarkPaidDialog } from '@/features/payments/components/MarkPaidDialog';
import { CreatePaymentDialog, CreatePaymentPayload } from '@/features/payments/components/CreatePaymentDialog';
import { OverdueInvoicesTable } from '@/features/payments/components/OverdueInvoicesTable';
import { PaymentPlanDialog } from '@/features/payments/components/PaymentPlanDialog';
import { PaymentsFilters } from '@/features/payments/components/PaymentsFilters';
import { PaymentsStats } from '@/features/payments/components/PaymentsStats';
import { PaymentsTable } from '@/features/payments/components/PaymentsTable';
import { useMerchantPayments } from '@/features/payments/hooks/useMerchantPayments';
import { Invoice, Payment } from '@/features/payments/types';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { TabsPageSkeleton } from '@/shared/components/ui/PageSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Bell, CreditCard, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function MerchantPayments() {
  const { merchant } = useAuth();
  const merchantId = merchant?.id;
  
  const { 
    payments, 
    overdueInvoices, 
    isLoading, 
    markPaid, 
    createPayment,
    isCreatingPayment,
    sendReminder, 
    sendBulkReminder,
    isMarkingPaid,
    isSendingBulkReminder,
    sendingReminderId,
    refetchPayments
  } = useMerchantPayments(merchantId);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paymentPlanInvoice, setPaymentPlanInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination state
  const [historyPage, setHistoryPage] = useState(1);
  const [overduePage, setOverduePage] = useState(1);

  // Reset pagination when filters change
  useEffect(() => {
    setHistoryPage(1);
    setOverduePage(1);
  }, [debouncedSearch, statusFilter]);

  const handleOpenMarkPaid = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsMarkPaidOpen(true);
  };

  const handleMarkPaidConfirm = ({ paymentId, method, reference, proofPhotoUrl }: { paymentId: string; method: string; reference: string; proofPhotoUrl?: string }) => {
    markPaid({ id: paymentId, payment_method: method, reference, proof_photo_url: proofPhotoUrl }, {
      onSuccess: () => {
        setIsMarkPaidOpen(false);
        setSelectedPayment(null);
      }
    });
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = (payment.reference?.toLowerCase() || '').includes(debouncedSearch.toLowerCase()) ||
        payment.payment_type.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, debouncedSearch, statusFilter]);

  const paginatedPayments = useMemo(() => {
    const start = (historyPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, historyPage]);

  // Also filter overdue invoices if needed (though typically we don't filter them by status/search as much, 
  // but let's apply search query for consistency if relevant, or just paginate)
  // Assuming overdueInvoices are just overdue, we might only filter by search query
  const filteredOverdueInvoices = useMemo(() => {
    return overdueInvoices.filter(invoice => {
      const matchesSearch = (invoice.invoice_number.toLowerCase() || '').includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    });
  }, [overdueInvoices, debouncedSearch]);

  const paginatedOverdueInvoices = useMemo(() => {
    const start = (overduePage - 1) * ITEMS_PER_PAGE;
    return filteredOverdueInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOverdueInvoices, overduePage]);

  if (isLoading && payments.length === 0) {
    return <TabsPageSkeleton statsCount={4} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={CreditCard} title="Pembayaran" description="Lacak pembayaran sewa dan riwayat pembayaran">
          <Button 
            variant="outline" 
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pembayaran
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refetchPayments()} 
            title="Refresh Data"
            className="rounded-xl"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {overdueInvoices.length > 0 && (
            <Button 
              onClick={() => sendBulkReminder()} 
              disabled={isSendingBulkReminder}
              className="gradient-cta rounded-xl"
            >
              {isSendingBulkReminder ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Kirim Pengingat
            </Button>
          )}
        </PageHeader>

        <PaymentsStats payments={payments} />

        <PaymentsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="pill-tab-list">
            <TabsTrigger value="history" className="pill-tab-trigger">
              Riwayat Pembayaran
              {filteredPayments.filter(p => p.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                  {filteredPayments.filter(p => p.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="pill-tab-trigger relative">
              Tagihan Terlambat
              {overdueInvoices.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                  {overdueInvoices.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <PaymentsTable 
              payments={paginatedPayments} 
              loading={isLoading} 
              onMarkPaid={handleOpenMarkPaid}
              onSendReminder={sendReminder}
              sendingReminderId={sendingReminderId}
              page={historyPage}
              totalPages={Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)}
              totalPayments={filteredPayments.length}
              onPageChange={setHistoryPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </TabsContent>

          <TabsContent value="overdue">
            <OverdueInvoicesTable 
              invoices={paginatedOverdueInvoices} 
              onSetupPaymentPlan={setPaymentPlanInvoice}
              page={overduePage}
              totalPages={Math.ceil(filteredOverdueInvoices.length / ITEMS_PER_PAGE)}
              totalInvoices={filteredOverdueInvoices.length}
              onPageChange={setOverduePage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </TabsContent>
        </Tabs>

        <MarkPaidDialog
          open={isMarkPaidOpen}
          onOpenChange={setIsMarkPaidOpen}
          payment={selectedPayment}
          onConfirm={handleMarkPaidConfirm}
          loading={isMarkingPaid}
        />
        <CreatePaymentDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          merchantId={merchantId || ''}
          onSubmit={(payload: CreatePaymentPayload) => {
            createPayment(payload, {
              onSuccess: () => setIsCreateOpen(false),
            });
          }}
          loading={isCreatingPayment}
        />

        <PaymentPlanDialog
          open={!!paymentPlanInvoice}
          onOpenChange={(open) => !open && setPaymentPlanInvoice(null)}
          invoice={paymentPlanInvoice ? {
            id: paymentPlanInvoice.id,
            invoice_number: paymentPlanInvoice.invoice_number,
            total_amount: paymentPlanInvoice.total_amount,
            late_fee: paymentPlanInvoice.late_fee || 0,
            tenant_user_id: paymentPlanInvoice.tenant_user_id,
            merchant_id: merchantId || '',
          } : null}
        />
    </div>
  );
}
