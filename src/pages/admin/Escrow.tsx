import { useAdminGuard } from '@/features/auth/hooks/useAdminGuard';
import { AdminDisbursementDialog } from '@/features/escrow/components/admin/AdminDisbursementDialog';
import { AdminEscrowAccountsTable } from '@/features/escrow/components/admin/AdminEscrowAccountsTable';
import { AdminEscrowFilters } from '@/features/escrow/components/admin/AdminEscrowFilters';
import { AdminEscrowReviewsTable } from '@/features/escrow/components/admin/AdminEscrowReviewsTable';
import { AdminEscrowStats } from '@/features/escrow/components/admin/AdminEscrowStats';
import { AdminEscrowTransactionsTable } from '@/features/escrow/components/admin/AdminEscrowTransactionsTable';
import { AdminReviewDialog } from '@/features/escrow/components/admin/AdminReviewDialog';
import { AdminTransactionDetailDialog } from '@/features/escrow/components/admin/AdminTransactionDetailDialog';
import { useEscrow } from "@/features/escrow/hooks/useEscrow";
import { EscrowAccount, EscrowTransaction, PendingDisbursement } from '@/features/escrow/types';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatCurrency } from '@/shared/utils/currency';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
const ITEMS_PER_PAGE = 20;

export default function AdminEscrow() {
  const { isAdmin, isLoading: guardLoading } = useAdminGuard();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const {
    accounts,
    transactions,
    totalTransactions,
    pendingReviews,
    isLoading,
    processDisbursement,
    approveReview,
    rejectReview
  } = useEscrow(currentPage, ITEMS_PER_PAGE, isAdmin, {
    search: debouncedSearch,
    status: statusFilter,
    type: typeFilter
  });

  const [showDisbursementDialog, setShowDisbursementDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showTransactionDetailDialog, setShowTransactionDetailDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<EscrowAccount | null>(null);
  const [selectedReview, setSelectedReview] = useState<PendingDisbursement | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [disbursementAmount, setDisbursementAmount] = useState('');
  const [disbursementDescription, setDisbursementDescription] = useState('Pencairan admin');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showConfirmDisbursement, setShowConfirmDisbursement] = useState(false);
  const { toast } = useToast();

  const handleDisbursement = (amount: number, description: string) => {
    if (!selectedAccount) return;
    
    setDisbursementAmount(amount.toString());
    setDisbursementDescription(description);

    if (amount > selectedAccount.balance) {
      toast({
        variant: 'destructive',
        title: 'Saldo Tidak Cukup',
        description: `Jumlah pencairan melebihi saldo tersedia sebesar ${formatCurrency(selectedAccount.balance)}`,
      });
      return;
    }

    const minAmount = selectedAccount.merchant?.min_disbursement_amount || 0;
    if (minAmount > 0 && amount < minAmount) {
      toast({
        variant: 'destructive',
        title: 'Di Bawah Minimum',
        description: `Pencairan harus setidaknya ${formatCurrency(minAmount)}`,
      });
      return;
    }

    setShowConfirmDisbursement(true);
  };

  const confirmDisbursement = () => {
    if (!selectedAccount || !disbursementAmount) return;
    
    const amount = parseFloat(disbursementAmount);
    
    processDisbursement.mutate({
      accountId: selectedAccount.id,
      amount,
      description: disbursementDescription
    }, {
      onSuccess: () => {
        setShowDisbursementDialog(false);
        setShowConfirmDisbursement(false);
        setSelectedAccount(null);
        setDisbursementAmount('');
        setDisbursementDescription('Pencairan admin');
      }
    });
  };

  const handleApproveReview = (notes: string) => {
    if (!selectedReview) return;
    
    approveReview.mutate({
      id: selectedReview.id,
      status: 'approved',
      notes: notes || 'Disetujui oleh admin',
      amount: selectedReview.net_amount,
      escrow_account_id: selectedReview.escrow_account_id,
      bank_account_id: selectedReview.bank_account_id,
      merchant_id: selectedReview.merchant?.id,
      user_id: selectedReview.merchant?.user_id,
      business_name: selectedReview.merchant?.business_name
    }, {
      onSuccess: () => {
        setShowReviewDialog(false);
        setSelectedReview(null);
        setReviewNotes('');
      }
    });
  };

  const handleRejectReview = (notes: string) => {
    if (!selectedReview) return;
    
    if (!notes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Catatan Diperlukan',
        description: 'Harap berikan alasan penolakan',
      });
      return;
    }
    
    rejectReview.mutate({
      id: selectedReview.id,
      status: 'rejected',
      notes: notes,
      user_id: selectedReview.merchant?.user_id,
      business_name: selectedReview.merchant?.business_name
    }, {
      onSuccess: () => {
        setShowReviewDialog(false);
        setSelectedReview(null);
        setReviewNotes('');
      }
    });
  };

  const openDisbursementDialog = (account: EscrowAccount) => {
    setSelectedAccount(account);
    setDisbursementDescription('Pencairan admin');
    setShowDisbursementDialog(true);
  };

  const openReviewDialog = (disbursement: PendingDisbursement) => {
    setSelectedReview(disbursement);
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  const openTransactionDetail = (tx: EscrowTransaction) => {
    setSelectedTransaction(tx);
    setShowTransactionDetailDialog(true);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalPending = accounts.reduce((sum, acc) => sum + acc.pending_balance, 0);
  const completedToday = transactions.filter(tx => 
    tx.status === 'completed' && 
    new Date(tx.created_at).toDateString() === new Date().toDateString()
  ).length;

  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);

  if (guardLoading) {
    return (
      <AdminLayout title="Manajemen Escrow" description="Pantau saldo dan kelola pencairan">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Escrow" description="Pantau saldo dan kelola pencairan">
      <div className="space-y-6">

        {/* Stats */}
        <AdminEscrowStats 
          accounts={accounts}
          transactions={transactions}
          totalTransactions={totalTransactions}
          pendingReviews={pendingReviews}
        />

        {/* Main Content */}
        <Tabs defaultValue="accounts" className="w-full">
          <TabsList>
            <TabsTrigger value="accounts">Akun Escrow</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="reviews" className="relative">
              Tinjauan Manual
              {pendingReviews.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                  {pendingReviews.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Akun Merchant</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminEscrowAccountsTable
                  accounts={accounts}
                  loading={isLoading}
                  onDisburse={openDisbursementDialog}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <AdminEscrowFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <AdminEscrowTransactionsTable
                  transactions={transactions}
                  loading={isLoading}
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tinjauan Manual Tertunda</CardTitle>
                <CardDescription>
                  Pencairan yang memerlukan persetujuan manual karena jumlah besar atau tanda keamanan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminEscrowReviewsTable
                  reviews={pendingReviews}
                  loading={isLoading}
                  onReview={openReviewDialog}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Disbursement Dialog */}
        <AdminDisbursementDialog
          open={showDisbursementDialog}
          onOpenChange={setShowDisbursementDialog}
          account={selectedAccount}
          onProcess={handleDisbursement}
        />

        {/* Confirm Disbursement Dialog */}
        <ConfirmDialog
          open={showConfirmDisbursement}
          onOpenChange={setShowConfirmDisbursement}
          onConfirm={confirmDisbursement}
          title="Konfirmasi Pencairan"
          description={`Apakah Anda yakin ingin mencairkan ${disbursementAmount ? formatCurrency(parseFloat(disbursementAmount)) : '0'} ke ${selectedAccount?.merchant?.business_name}? Tindakan ini tidak dapat dibatalkan.`}
        />

        {/* Review Dialog */}
        <AdminReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          review={selectedReview}
          onApprove={handleApproveReview}
          onReject={handleRejectReview}
        />

        {/* Transaction Detail Dialog */}
        <AdminTransactionDetailDialog
          open={showTransactionDetailDialog}
          onOpenChange={setShowTransactionDetailDialog}
          transaction={selectedTransaction}
        />
      </div>
    </AdminLayout>
  );
}
