import { useAdminGuard } from '@/features/auth/hooks/useAdminGuard';
import { useEscrow } from "@/features/escrow/hooks/useEscrow";
import { EscrowAccount, EscrowTransaction, PendingDisbursement } from '@/features/escrow/types';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { format } from 'date-fns';
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Search,
  Wallet
} from 'lucide-react';
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
  const [disbursementDescription, setDisbursementDescription] = useState('Admin disbursement');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showConfirmDisbursement, setShowConfirmDisbursement] = useState(false);
  const { toast } = useToast();

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
        setDisbursementDescription('Admin disbursement');
      }
    });
  };

  const handleApproveReview = () => {
    if (!selectedReview) return;
    
    approveReview.mutate({
      id: selectedReview.id,
      status: 'approved',
      notes: reviewNotes || 'Approved by admin',
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

  const handleRejectReview = () => {
    if (!selectedReview) return;
    
    if (!reviewNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Notes Required',
        description: 'Please provide a reason for rejection',
      });
      return;
    }
    
    rejectReview.mutate({
      id: selectedReview.id,
      status: 'rejected',
      notes: reviewNotes,
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
                  <CheckCircle className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={pendingReviews.length > 0 ? 'border-destructive/50 bg-destructive/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  <p className="text-2xl font-bold">{pendingReviews.length}</p>
                </div>
                <div className={`p-3 rounded-lg ${pendingReviews.length > 0 ? 'bg-destructive/20' : 'bg-muted'}`}>
                  <AlertCircle className={`h-6 w-6 ${pendingReviews.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="accounts" className="w-full">
          <TabsList>
            <TabsTrigger value="accounts">Escrow Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reviews" className="relative">
              Manual Reviews
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
                <CardTitle>Merchant Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Pending Balance</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.merchant?.business_name}</TableCell>
                          <TableCell>{formatCurrency(account.balance)}</TableCell>
                          <TableCell>{formatCurrency(account.pending_balance)}</TableCell>
                          <TableCell>{format(new Date(account.updated_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => openDisbursementDialog(account)}>
                              Disburse
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {accounts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No escrow accounts found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <CardTitle>Transaction History</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Merchant</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{format(new Date(tx.created_at), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{tx.escrow_account?.merchant?.business_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{tx.type}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                            <TableCell>{formatCurrency(tx.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => openTransactionDetail(tx)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {transactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages || 1}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Manual Reviews</CardTitle>
                <CardDescription>
                  Disbursements requiring manual approval due to large amounts or security flags
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Bank Account</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell>{format(new Date(review.created_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{review.merchant?.business_name}</TableCell>
                          <TableCell>{formatCurrency(review.amount)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{review.bank_account?.bank_name}</div>
                              <div className="text-muted-foreground">{review.bank_account?.account_number}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="default" size="sm" className="mr-2" onClick={() => openReviewDialog(review)}>
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pendingReviews.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No pending reviews
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
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
                Manually process a disbursement for {selectedAccount?.merchant?.business_name}.
                Current Balance: {selectedAccount && formatCurrency(selectedAccount.balance)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Amount (IDR)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Reason for disbursement..."
                  value={disbursementDescription}
                  onChange={(e) => setDisbursementDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisbursementDialog(false)}>Cancel</Button>
              <Button onClick={handleDisbursement}>Process</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Disbursement Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDisbursement}
          onClose={() => setShowConfirmDisbursement(false)}
          onConfirm={confirmDisbursement}
          title="Confirm Disbursement"
          description={`Are you sure you want to disburse ${disbursementAmount ? formatCurrency(parseFloat(disbursementAmount)) : '0'} to ${selectedAccount?.merchant?.business_name}? This action cannot be undone.`}
        />

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Disbursement Request</DialogTitle>
              <DialogDescription>
                Review request from {selectedReview?.merchant?.business_name} for {selectedReview && formatCurrency(selectedReview.amount)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant:</span>
                  <span className="font-medium">{selectedReview?.merchant?.business_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{selectedReview && formatCurrency(selectedReview.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-medium">{selectedReview?.bank_account?.bank_name} - {selectedReview?.bank_account?.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Name:</span>
                  <span className="font-medium">{selectedReview?.bank_account?.account_name}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Review Notes (Optional for Approval, Required for Rejection)</Label>
                <Textarea
                  placeholder="Enter notes..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="destructive" onClick={handleRejectReview}>Reject</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
                <Button onClick={handleApproveReview}>Approve</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transaction Detail Dialog */}
        <Dialog open={showTransactionDetailDialog} onOpenChange={setShowTransactionDetailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedTransaction && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-sm">{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{format(new Date(selectedTransaction.created_at), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge variant="outline">{selectedTransaction.type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={selectedTransaction.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedTransaction.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-bold text-lg">{formatCurrency(selectedTransaction.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Merchant</p>
                      <p className="font-medium">{selectedTransaction.escrow_account?.merchant?.business_name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      {selectedTransaction.description || 'No description provided'}
                    </div>
                  </div>

                  {selectedTransaction.reference && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Reference</p>
                      <p className="font-mono text-sm">{selectedTransaction.reference}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowTransactionDetailDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
