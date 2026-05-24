import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { TabsPageSkeleton } from '@/shared/components/ui/PageSkeleton';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useMerchantPayments } from '@/features/payments/hooks/useMerchantPayments';
import { PaymentsFilters } from '@/features/payments/components/PaymentsFilters';
import { PaymentsStats } from '@/features/payments/components/PaymentsStats';
import { PaymentsTable } from '@/features/payments/components/PaymentsTable';
import { CreatePaymentDialog } from '@/features/payments/components/CreatePaymentDialog';
import { MarkPaidDialog } from '@/features/payments/components/MarkPaidDialog';
import { Payment } from '@/features/payments/types';

const ITEMS_PER_PAGE = 10;

const STATUS_TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Tertunda' },
  { value: 'paid', label: 'Lunas' },
  { value: 'overdue', label: 'Terlambat' },
];

export default function MerchantPayments() {
  const { merchant } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [markPaidPayment, setMarkPaidPayment] = useState<Payment | null>(null);

  const { payments, isLoading, createPayment, markPaid, sendReminder, isCreating, isMarkingPaid, isSendingReminder } = useMerchantPayments(merchant?.id);

  useEffect(() => { setPage(1); }, [debouncedSearch, activeTab]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = !debouncedSearch ||
        p.reference?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesTab = activeTab === 'all' || p.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [payments, debouncedSearch, activeTab]);

  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, page]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: payments.length, pending: 0, paid: 0, overdue: 0 };
    payments.forEach(p => { if (p.status in counts) counts[p.status]++; });
    return counts;
  }, [payments]);

  if (isLoading) return <TabsPageSkeleton statsCount={3} />;

  return (
    <div className="space-y-6">
      <PageHeader icon={CreditCard} title="Pembayaran" description="Kelola dan lacak pembayaran sewa">
        <Button onClick={() => setIsCreateOpen(true)} className="gradient-cta rounded-xl" aria-label="Buat pembayaran baru">
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Buat Pembayaran
        </Button>
      </PageHeader>

      <PaymentsStats payments={payments} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="pill-tab-list" aria-label="Filter pembayaran berdasarkan status">
          {STATUS_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="pill-tab-trigger">
              {tab.label}
              <span className="ml-1.5 text-[10px] bg-muted/60 px-1.5 py-0.5 rounded-full">
                {statusCounts[tab.value] || 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <PaymentsFilters searchTerm={searchQuery} onSearchChange={setSearchQuery} />

      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-4">
        <PaymentsTable
          payments={paginatedPayments}
          isLoading={isLoading}
          onMarkPaid={setMarkPaidPayment}
          onSendReminder={sendReminder}
          isSendingReminder={isSendingReminder}
          page={page}
          totalPages={Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)}
          totalPayments={filteredPayments.length}
          onPageChange={setPage}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      <CreatePaymentDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        merchantId={merchant?.id}
        onCreate={createPayment}
        isCreating={isCreating}
      />

      <MarkPaidDialog
        open={!!markPaidPayment}
        onOpenChange={(open) => !open && setMarkPaidPayment(null)}
        payment={markPaidPayment}
        onConfirm={({ paymentId, method, reference, proofPhotoUrl }) => {
          markPaid({ id: paymentId, payment_method: method, reference, proof_photo_url: proofPhotoUrl }, {
            onSuccess: () => setMarkPaidPayment(null),
          });
        }}
        loading={isMarkingPaid}
      />
    </div>
  );
}
