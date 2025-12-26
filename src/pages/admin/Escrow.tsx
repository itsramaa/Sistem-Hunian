import { useState, useEffect } from 'react';
import { 
  Search, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  Building2,
  TrendingUp,
  DollarSign,
  Send,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { createAuditLog } from '@/lib/auditLog';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface EscrowAccount {
  id: string;
  merchant_id: string;
  balance: number;
  pending_balance: number;
  created_at: string;
  updated_at: string;
  merchant?: {
    business_name: string;
    user_id: string;
    min_disbursement_amount?: number;
  };
}

interface EscrowTransaction {
  id: string;
  escrow_account_id: string;
  contract_id: string | null;
  amount: number;
  type: string;
  status: string;
  reference: string | null;
  description: string | null;
  processed_at: string | null;
  created_at: string;
  escrow_account?: {
    merchant?: {
      business_name: string;
    };
  };
}

interface PendingDisbursement {
  id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  type: string;
  status: string;
  created_at: string;
  requires_manual_review: boolean;
  escrow_account_id: string;
  bank_account_id: string;
  merchant?: {
    id: string;
    business_name: string;
    user_id: string;
    verification_status: string;
  };
  bank_account?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  pending_review: 'bg-orange-500/10 text-orange-600 border-orange-300',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-300',
  completed: 'bg-success/10 text-success border-success/30',
  failed: 'bg-destructive/10 text-destructive border-destructive/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  cancelled: 'bg-muted text-muted-foreground border-muted',
};

const typeColors: Record<string, string> = {
  deposit: 'bg-success/10 text-success border-success/30',
  rent_payment: 'bg-info/10 text-info border-info/30',
  disbursement: 'bg-primary/10 text-primary border-primary/30',
  refund: 'bg-warning/10 text-warning border-warning/30',
  fee: 'bg-muted text-muted-foreground border-muted',
};

const ITEMS_PER_PAGE = 20;

export default function AdminEscrow() {
  const { isAdmin, isLoading: guardLoading } = useAdminGuard();
  const [accounts, setAccounts] = useState<EscrowAccount[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingDisbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDisbursementDialog, setShowDisbursementDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showTransactionDetailDialog, setShowTransactionDetailDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<EscrowAccount | null>(null);
  const [selectedReview, setSelectedReview] = useState<PendingDisbursement | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [disbursementAmount, setDisbursementAmount] = useState('');
  const [disbursementDescription, setDisbursementDescription] = useState('Admin disbursement');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [showConfirmDisbursement, setShowConfirmDisbursement] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch escrow accounts with merchant info
      const { data: accountsData, error: accountsError } = await supabase
        .from('escrow_accounts')
        .select('*, merchants:merchant_id(business_name, user_id, min_disbursement_amount)')
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;

      // Transform accounts data
      const transformedAccounts = (accountsData || []).map((acc: Record<string, unknown>) => ({
        ...acc,
        merchant: acc.merchants ? {
          business_name: (acc.merchants as Record<string, unknown>).business_name as string,
          user_id: (acc.merchants as Record<string, unknown>).user_id as string,
          min_disbursement_amount: (acc.merchants as Record<string, unknown>).min_disbursement_amount as number | undefined,
        } : undefined
      }));
      setAccounts(transformedAccounts as EscrowAccount[]);

      // Get total count for pagination
      const { count } = await supabase
        .from('escrow_transactions')
        .select('id', { count: 'exact', head: true });
      setTotalTransactions(count || 0);

      // Fetch transactions with pagination
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const { data: txData, error: txError } = await supabase
        .from('escrow_transactions')
        .select('*, escrow_accounts:escrow_account_id(merchants:merchant_id(business_name))')
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (txError) throw txError;

      // Transform transactions data
      const transformedTransactions = (txData || []).map((tx: Record<string, unknown>) => ({
        ...tx,
        escrow_account: tx.escrow_accounts ? {
          merchant: (tx.escrow_accounts as Record<string, unknown>).merchants ? {
            business_name: ((tx.escrow_accounts as Record<string, unknown>).merchants as Record<string, unknown>).business_name as string
          } : undefined
        } : undefined
      }));
      setTransactions(transformedTransactions as EscrowTransaction[]);

      // Fetch pending review disbursements
      const { data: pendingData, error: pendingError } = await supabase
        .from('disbursements')
        .select(`
          *,
          escrow_accounts:escrow_account_id(
            merchants:merchant_id(id, business_name, user_id, verification_status)
          ),
          bank_accounts:bank_account_id(bank_name, account_number, account_name)
        `)
        .eq('requires_manual_review', true)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: true });

      if (pendingError) throw pendingError;

      const transformedPending = (pendingData || []).map((d: Record<string, unknown>) => ({
        ...d,
        merchant: (d.escrow_accounts as Record<string, unknown>)?.merchants || undefined,
        bank_account: d.bank_accounts || undefined,
      }));
      setPendingReviews(transformedPending as PendingDisbursement[]);

    } catch (error) {
      console.error('Error fetching escrow data:', error);
      toast({
        variant: 'destructive',
        title: 'Error Loading Escrow Data',
        description: error instanceof Error ? error.message : 'Failed to load escrow data. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisbursement = async () => {
    if (!selectedAccount || !disbursementAmount) return;
    
    const amount = parseFloat(disbursementAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid positive amount',
      });
      return;
    }

    if (amount > selectedAccount.balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: `Disbursement amount exceeds available balance of ${formatCurrency(selectedAccount.balance)}`,
      });
      return;
    }

    const minAmount = selectedAccount.merchant?.min_disbursement_amount || 0;
    if (minAmount > 0 && amount < minAmount) {
      toast({
        variant: 'destructive',
        title: 'Below Minimum',
        description: `Disbursement must be at least ${formatCurrency(minAmount)}`,
      });
      return;
    }

    setShowConfirmDisbursement(true);
  };

  const confirmDisbursement = async () => {
    if (!selectedAccount || !disbursementAmount) return;
    
    const amount = parseFloat(disbursementAmount);
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create disbursement transaction
      const { error: txError } = await supabase
        .from('escrow_transactions')
        .insert({
          escrow_account_id: selectedAccount.id,
          amount: amount,
          type: 'disbursement',
          status: 'completed',
          description: disbursementDescription || 'Admin disbursement',
          processed_at: new Date().toISOString(),
        });

      if (txError) throw txError;

      // Update account balance
      const { error: updateError } = await supabase
        .from('escrow_accounts')
        .update({ 
          balance: selectedAccount.balance - amount,
        })
        .eq('id', selectedAccount.id);

      if (updateError) throw updateError;

      // Log audit
      await createAuditLog({
        action: 'disbursement',
        entityType: 'escrow',
        entityId: selectedAccount.id,
        oldData: { balance: selectedAccount.balance },
        newData: { balance: selectedAccount.balance - amount, disbursed: amount },
        userId: user?.id,
      });

      toast({
        title: 'Disbursement Processed',
        description: `${formatCurrency(amount)} has been disbursed to ${selectedAccount.merchant?.business_name}`,
      });
      
      setShowDisbursementDialog(false);
      setShowConfirmDisbursement(false);
      setSelectedAccount(null);
      setDisbursementAmount('');
      setDisbursementDescription('Admin disbursement');
      fetchData();
    } catch (error) {
      console.error('Error processing disbursement:', error);
      toast({
        variant: 'destructive',
        title: 'Disbursement Failed',
        description: error instanceof Error ? error.message : 'Failed to process disbursement. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveReview = async () => {
    if (!selectedReview) return;
    
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Call xendit-disbursement edge function
      const { data, error } = await supabase.functions.invoke('xendit-disbursement', {
        body: {
          escrow_account_id: selectedReview.escrow_account_id,
          bank_account_id: selectedReview.bank_account_id,
          amount: selectedReview.amount,
          type: 'on_demand',
          description: `Approved manual review disbursement`,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Disbursement failed');

      // Update the original pending disbursement to approved
      await supabase
        .from('disbursements')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          review_notes: reviewNotes || 'Approved by admin',
        })
        .eq('id', selectedReview.id);

      // Log audit
      await createAuditLog({
        action: 'approve',
        entityType: 'disbursement',
        entityId: selectedReview.id,
        newData: { status: 'approved', amount: selectedReview.net_amount },
        userId: user?.id,
      });

      // Notify merchant
      if (selectedReview.merchant?.user_id) {
        await supabase.from('notifications').insert({
          user_id: selectedReview.merchant.user_id,
          title: 'Disbursement Approved',
          message: `Your disbursement request of Rp ${selectedReview.net_amount.toLocaleString()} has been approved and is being processed.`,
          type: 'payment',
          link: '/merchant/escrow',
        });
      }

      toast({
        title: 'Disbursement Approved',
        description: `Disbursement of ${formatCurrency(selectedReview.net_amount)} to ${selectedReview.merchant?.business_name} is being processed`,
      });
      
      setShowReviewDialog(false);
      setSelectedReview(null);
      setReviewNotes('');
      fetchData();
    } catch (error) {
      console.error('Error approving disbursement:', error);
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve disbursement. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReview = async () => {
    if (!selectedReview) return;
    
    if (!reviewNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Notes Required',
        description: 'Please provide a reason for rejection',
      });
      return;
    }
    
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update disbursement to rejected
      await supabase
        .from('disbursements')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          review_notes: reviewNotes,
        })
        .eq('id', selectedReview.id);

      // Log audit
      await createAuditLog({
        action: 'reject',
        entityType: 'disbursement',
        entityId: selectedReview.id,
        newData: { status: 'rejected', reason: reviewNotes },
        userId: user?.id,
      });

      // Notify merchant
      if (selectedReview.merchant?.user_id) {
        await supabase.from('notifications').insert({
          user_id: selectedReview.merchant.user_id,
          title: 'Disbursement Rejected',
          message: `Your disbursement request was rejected. Reason: ${reviewNotes}. Your funds remain in your escrow account.`,
          type: 'payment',
          link: '/merchant/escrow',
        });
      }

      toast({
        title: 'Disbursement Rejected',
        description: `${selectedReview.merchant?.business_name} has been notified`,
      });
      
      setShowReviewDialog(false);
      setSelectedReview(null);
      setReviewNotes('');
      fetchData();
    } catch (error) {
      console.error('Error rejecting disbursement:', error);
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject disbursement. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openDisbursementDialog = (account: EscrowAccount) => {
    setSelectedAccount(account);
    setDisbursementDescription('Admin disbursement');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.escrow_account?.merchant?.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalPending = accounts.reduce((sum, acc) => sum + acc.pending_balance, 0);
  const completedToday = transactions.filter(tx => 
    tx.status === 'completed' && 
    new Date(tx.created_at).toDateString() === new Date().toDateString()
  ).length;

  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);

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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Escrow Management</h1>
          <p className="text-muted-foreground">Monitor balances and manage disbursements</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10">
                  <Wallet className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Accounts</p>
                  <p className="text-2xl font-bold">{accounts.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transactions Today</p>
                  <p className="text-2xl font-bold">{completedToday}</p>
                </div>
                <div className="p-3 rounded-lg bg-info/10">
                  <TrendingUp className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={pendingReviews.length > 0 ? 'border-orange-500/50 bg-orange-500/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{pendingReviews.length}</p>
                </div>
                <div className={`p-3 rounded-lg ${pendingReviews.length > 0 ? 'bg-orange-500/20' : 'bg-muted'}`}>
                  <ShieldAlert className={`h-6 w-6 ${pendingReviews.length > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="accounts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="accounts">Escrow Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reviews" className="relative">
              Pending Reviews
              {pendingReviews.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingReviews.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Merchant Escrow Accounts</CardTitle>
                <CardDescription>Manage escrow balances for all merchants</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No escrow accounts found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accounts.map(account => (
                      <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{account.merchant?.business_name || 'Unknown Merchant'}</p>
                            <p className="text-sm text-muted-foreground">
                              Balance: {formatCurrency(account.balance)} • Pending: {formatCurrency(account.pending_balance)}
                            </p>
                            {account.merchant?.min_disbursement_amount && account.merchant.min_disbursement_amount > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Min disbursement: {formatCurrency(account.merchant.min_disbursement_amount)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => openDisbursementDialog(account)}
                          disabled={account.balance <= 0}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Disburse
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View all escrow transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="rent_payment">Rent Payment</SelectItem>
                      <SelectItem value="disbursement">Disbursement</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transactions List */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {filteredTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => openTransactionDetail(tx)}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${tx.type === 'disbursement' ? 'bg-destructive/10' : 'bg-success/10'}`}>
                              {tx.type === 'disbursement' ? (
                                <ArrowUpRight className={`h-4 w-4 text-destructive`} />
                              ) : (
                                <ArrowDownRight className={`h-4 w-4 text-success`} />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{tx.escrow_account?.merchant?.business_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{tx.description || tx.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`font-medium ${tx.type === 'disbursement' ? 'text-destructive' : 'text-success'}`}>
                                {tx.type === 'disbursement' ? '-' : '+'}{formatCurrency(tx.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm')}
                              </p>
                            </div>
                            <Badge className={statusColors[tx.status]}>{tx.status}</Badge>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages} ({totalTransactions} total)
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Pending Manual Reviews</CardTitle>
                <CardDescription>Disbursements requiring admin approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                    <p className="text-muted-foreground">No pending reviews</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingReviews.map(review => (
                      <div key={review.id} className="flex items-center justify-between p-4 border border-orange-500/30 rounded-lg bg-orange-500/5">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-orange-500/20">
                            <ShieldAlert className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">{review.merchant?.business_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              Amount: {formatCurrency(review.net_amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Bank: {review.bank_account?.bank_name} - {review.bank_account?.account_number}
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => openReviewDialog(review)}>
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Disbursement Dialog */}
        <Dialog open={showDisbursementDialog} onOpenChange={setShowDisbursementDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Disbursement</DialogTitle>
              <DialogDescription>
                Disburse funds from {selectedAccount?.merchant?.business_name}'s escrow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Available Balance</Label>
                <p className="text-2xl font-bold">{formatCurrency(selectedAccount?.balance || 0)}</p>
              </div>
              {selectedAccount?.merchant?.min_disbursement_amount && selectedAccount.merchant.min_disbursement_amount > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Minimum disbursement amount: {formatCurrency(selectedAccount.merchant.min_disbursement_amount)}
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="amount">Disbursement Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter disbursement description..."
                  value={disbursementDescription}
                  onChange={(e) => setDisbursementDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisbursementDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDisbursement} disabled={!disbursementAmount}>
                Process Disbursement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Disbursement Dialog */}
        <ConfirmDialog
          open={showConfirmDisbursement}
          onOpenChange={setShowConfirmDisbursement}
          title="Confirm Disbursement"
          description={`Are you sure you want to disburse ${formatCurrency(parseFloat(disbursementAmount) || 0)} to ${selectedAccount?.merchant?.business_name}?`}
          confirmText="Confirm Disbursement"
          onConfirm={confirmDisbursement}
          loading={actionLoading}
          variant="default"
        />

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Disbursement</DialogTitle>
              <DialogDescription>
                Review and approve or reject this disbursement request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Merchant</Label>
                  <p className="font-medium">{selectedReview?.merchant?.business_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium">{formatCurrency(selectedReview?.net_amount || 0)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bank</Label>
                  <p className="font-medium">{selectedReview?.bank_account?.bank_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account</Label>
                  <p className="font-medium">{selectedReview?.bank_account?.account_number}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Review Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter notes (required for rejection)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectReview} disabled={actionLoading}>
                Reject
              </Button>
              <Button onClick={handleApproveReview} disabled={actionLoading}>
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transaction Detail Dialog */}
        <Dialog open={showTransactionDetailDialog} onOpenChange={setShowTransactionDetailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Merchant</Label>
                  <p className="font-medium">{selectedTransaction?.escrow_account?.merchant?.business_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <Badge className={typeColors[selectedTransaction?.type || '']}>{selectedTransaction?.type}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium">{formatCurrency(selectedTransaction?.amount || 0)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedTransaction?.status || '']}>{selectedTransaction?.status}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reference</Label>
                  <p className="font-medium font-mono text-sm">{selectedTransaction?.reference || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{selectedTransaction ? format(new Date(selectedTransaction.created_at), 'dd MMM yyyy HH:mm:ss') : '-'}</p>
                </div>
              </div>
              {selectedTransaction?.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">{selectedTransaction.description}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransactionDetailDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}