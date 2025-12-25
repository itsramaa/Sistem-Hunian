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
  Loader2
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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

export default function AdminEscrow() {
  const [accounts, setAccounts] = useState<EscrowAccount[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingDisbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDisbursementDialog, setShowDisbursementDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<EscrowAccount | null>(null);
  const [selectedReview, setSelectedReview] = useState<PendingDisbursement | null>(null);
  const [disbursementAmount, setDisbursementAmount] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch escrow accounts with merchant info
      const { data: accountsData, error: accountsError } = await supabase
        .from('escrow_accounts')
        .select('*, merchants:merchant_id(business_name, user_id)')
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;

      // Transform accounts data
      const transformedAccounts = (accountsData || []).map((acc: any) => ({
        ...acc,
        merchant: acc.merchants ? {
          business_name: acc.merchants.business_name,
          user_id: acc.merchants.user_id
        } : undefined
      }));
      setAccounts(transformedAccounts);

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('escrow_transactions')
        .select('*, escrow_accounts:escrow_account_id(merchants:merchant_id(business_name))')
        .order('created_at', { ascending: false })
        .limit(100);

      if (txError) throw txError;

      // Transform transactions data
      const transformedTransactions = (txData || []).map((tx: any) => ({
        ...tx,
        escrow_account: tx.escrow_accounts ? {
          merchant: tx.escrow_accounts.merchants ? {
            business_name: tx.escrow_accounts.merchants.business_name
          } : undefined
        } : undefined
      }));
      setTransactions(transformedTransactions);

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

      const transformedPending = (pendingData || []).map((d: any) => ({
        ...d,
        merchant: d.escrow_accounts?.merchants || undefined,
        bank_account: d.bank_accounts || undefined,
      }));
      setPendingReviews(transformedPending);

    } catch (error) {
      console.error('Error fetching escrow data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load escrow data',
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
        description: 'Please enter a valid amount',
      });
      return;
    }

    if (amount > selectedAccount.balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: 'Disbursement amount exceeds available balance',
      });
      return;
    }

    setActionLoading(true);
    try {
      // Create disbursement transaction
      const { error: txError } = await supabase
        .from('escrow_transactions')
        .insert({
          escrow_account_id: selectedAccount.id,
          amount: amount,
          type: 'disbursement',
          status: 'completed',
          description: 'Admin disbursement',
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

      toast({
        title: 'Disbursement Processed',
        description: `${formatCurrency(amount)} has been disbursed`,
      });
      
      setShowDisbursementDialog(false);
      setSelectedAccount(null);
      setDisbursementAmount('');
      fetchData();
    } catch (error: any) {
      console.error('Error processing disbursement:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to process disbursement',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveReview = async () => {
    if (!selectedReview) return;
    
    setActionLoading(true);
    try {
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
          review_notes: reviewNotes || 'Approved by admin',
        })
        .eq('id', selectedReview.id);

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
        description: `Disbursement of ${formatCurrency(selectedReview.net_amount)} is being processed`,
      });
      
      setShowReviewDialog(false);
      setSelectedReview(null);
      setReviewNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error approving disbursement:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to approve disbursement',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReview = async () => {
    if (!selectedReview || !reviewNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Notes Required',
        description: 'Please provide a reason for rejection',
      });
      return;
    }
    
    setActionLoading(true);
    try {
      // Update disbursement to rejected
      await supabase
        .from('disbursements')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq('id', selectedReview.id);

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
        description: 'The merchant has been notified',
      });
      
      setShowReviewDialog(false);
      setSelectedReview(null);
      setReviewNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error rejecting disbursement:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reject disbursement',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openDisbursementDialog = (account: EscrowAccount) => {
    setSelectedAccount(account);
    setShowDisbursementDialog(true);
  };

  const openReviewDialog = (disbursement: PendingDisbursement) => {
    setSelectedReview(disbursement);
    setReviewNotes('');
    setShowReviewDialog(true);
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
        <Tabs defaultValue={pendingReviews.length > 0 ? 'pending_review' : 'accounts'} className="space-y-4">
          <TabsList>
            <TabsTrigger value="accounts">
              Accounts ({accounts.length})
            </TabsTrigger>
            <TabsTrigger value="transactions">
              Transactions ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="pending_review" className="relative">
              Pending Review
              {pendingReviews.length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">{pendingReviews.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : accounts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No escrow accounts</h3>
                  <p className="text-muted-foreground text-center">
                    Escrow accounts will be created automatically when merchants register
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((account) => (
                  <Card key={account.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {account.merchant?.business_name || 'Unknown Merchant'}
                            </CardTitle>
                            <CardDescription>
                              Created {format(new Date(account.created_at), 'MMM d, yyyy')}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Available Balance</span>
                        <span className="text-lg font-bold text-success">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Pending</span>
                        <span className="text-sm font-medium text-warning">
                          {formatCurrency(account.pending_balance)}
                        </span>
                      </div>
                      <Button 
                        className="w-full mt-2" 
                        variant="outline"
                        disabled={account.balance <= 0}
                        onClick={() => openDisbursementDialog(account)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Disburse Funds
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="rent_payment">Rent Payment</SelectItem>
                  <SelectItem value="disbursement">Disbursement</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                  <p className="text-muted-foreground text-center">
                    {transactions.length === 0 
                      ? "No transactions have been recorded yet"
                      : "No transactions match your filters"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Merchant</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {tx.escrow_account?.merchant?.business_name || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={typeColors[tx.type]}>
                              <span className="flex items-center gap-1">
                                {tx.type === 'deposit' || tx.type === 'rent_payment' ? (
                                  <ArrowDownRight className="h-3 w-3" />
                                ) : (
                                  <ArrowUpRight className="h-3 w-3" />
                                )}
                                {tx.type.replace('_', ' ')}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              tx.type === 'deposit' || tx.type === 'rent_payment' 
                                ? 'text-success' 
                                : 'text-destructive'
                            }`}>
                              {tx.type === 'deposit' || tx.type === 'rent_payment' ? '+' : '-'}
                              {formatCurrency(tx.amount)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={statusColors[tx.status || 'pending']}>
                              <span className="flex items-center gap-1">
                                {tx.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                                {tx.status === 'pending' && <Clock className="h-3 w-3" />}
                                {tx.status === 'failed' && <XCircle className="h-3 w-3" />}
                                {tx.status}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pending Review Tab */}
          <TabsContent value="pending_review" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingReviews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-success mb-4" />
                  <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                  <p className="text-muted-foreground text-center">
                    No disbursement requests pending review
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((review) => (
                  <Card key={review.id} className="border-orange-500/30">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {review.merchant?.business_name || 'Unknown Merchant'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Requested {format(new Date(review.created_at), 'MMM d, yyyy HH:mm')}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-300">
                                {review.merchant?.verification_status === 'verified' ? 'Verified' : 'Unverified'}
                              </Badge>
                              <Badge variant="outline">
                                {review.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-2">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="text-2xl font-bold">{formatCurrency(review.amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              Fee: {formatCurrency(review.fee_amount)} → Net: {formatCurrency(review.net_amount)}
                            </p>
                          </div>
                          {review.bank_account && (
                            <div className="text-right text-sm text-muted-foreground">
                              <p>{review.bank_account.bank_name} - ****{review.bank_account.account_number.slice(-4)}</p>
                              <p>{review.bank_account.account_name}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => openReviewDialog(review)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button 
                            className="bg-success hover:bg-success/90"
                            onClick={() => openReviewDialog(review)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Review & Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Disbursement Dialog */}
        <Dialog open={showDisbursementDialog} onOpenChange={setShowDisbursementDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Disbursement</DialogTitle>
              <DialogDescription>
                Disburse funds to {selectedAccount?.merchant?.business_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(selectedAccount?.balance || 0)}
                </p>
              </div>
              <div>
                <Label htmlFor="amount">Disbursement Amount (IDR)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisbursementDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDisbursement} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Confirm Disbursement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Disbursement Request</DialogTitle>
              <DialogDescription>
                Review and approve or reject this disbursement request
              </DialogDescription>
            </DialogHeader>
            {selectedReview && (
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedReview.merchant?.business_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {selectedReview.merchant?.verification_status || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(selectedReview.net_amount)}</p>
                      <p className="text-sm text-muted-foreground">Net amount</p>
                    </div>
                  </div>
                </div>

                {selectedReview.bank_account && (
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm font-medium mb-2">Bank Details</p>
                    <p className="text-sm">{selectedReview.bank_account.bank_name}</p>
                    <p className="text-sm">{selectedReview.bank_account.account_number}</p>
                    <p className="text-sm text-muted-foreground">{selectedReview.bank_account.account_name}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Review Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes (required for rejection)"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejectReview} 
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                Reject
              </Button>
              <Button 
                className="bg-success hover:bg-success/90"
                onClick={handleApproveReview} 
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Approve & Process
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
