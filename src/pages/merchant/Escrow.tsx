import { MINIMUM_PAYOUT_AMOUNT } from '@/constants/platformFees';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DisbursementDialog } from '@/features/escrow/components/DisbursementDialog';
import { EscrowBalanceCards } from '@/features/escrow/components/EscrowBalanceCards';
import { EscrowFilters } from '@/features/escrow/components/EscrowFilters';
import { EscrowTransactionsTable } from '@/features/escrow/components/EscrowTransactionsTable';
import { DISBURSEMENT_OPTIONS } from '@/features/escrow/constants';
import { calculateDisbursementFee } from '@/features/escrow/utils/disbursement';
import { supabase } from '@/lib/integrations/supabase/client';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatCurrency } from '@/shared/utils/currency';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Calendar, CreditCard, Info, Loader2, Send, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_primary: boolean;
  merchant_id: string;
  branch_code: string | null;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function MerchantEscrow() {
  const { merchant, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Reset pagination when filters change
  useEffect(() => {
    setTransactionPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  // Fetch escrow account - using maybeSingle() instead of single()
  const { data: escrowAccount, isLoading: loadingAccount } = useQuery({
    queryKey: ['escrow-account', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return null;
      const { data, error } = await supabase
        .from('escrow_accounts')
        .select('*')
        .eq('merchant_id', merchant.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Fetch ALL transactions for client-side filtering/pagination
  const { data: allTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['escrow-transactions', escrowAccount?.id],
    queryFn: async () => {
      if (!escrowAccount?.id) return [];
      
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('escrow_account_id', escrowAccount.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!escrowAccount?.id,
  });

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    let result = allTransactions || [];

    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase();
      result = result.filter(tx => 
        (tx.description && tx.description.toLowerCase().includes(lowerSearch)) ||
        (tx.reference && tx.reference.toLowerCase().includes(lowerSearch))
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(tx => tx.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      result = result.filter(tx => tx.type === typeFilter);
    }

    return result;
  }, [allTransactions, debouncedSearch, statusFilter, typeFilter]);

  // Client-side pagination
  const transactions = useMemo(() => {
    const start = (transactionPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, transactionPage]);

  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);

  // Fetch merchant for disbursement schedule and stats
  const { data: merchantData } = useQuery({
    queryKey: ['merchant-disbursement', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return null;
      const { data, error } = await supabase
        .from('merchants')
        .select('disbursement_schedule, verification_status, total_disbursed, last_disbursement_date, min_disbursement_amount')
        .eq('id', merchant.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Fetch primary bank account
  const { data: bankAccount } = useQuery({
    queryKey: ['primary-bank-account', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return null;
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('merchant_id', merchant.id)
        .eq('is_primary', true)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown as BankAccount;
    },
    enabled: !!merchant?.id,
  });

  // Update disbursement schedule
  const updateSchedule = useMutation({
    mutationFn: async (schedule: string) => {
      const { error } = await supabase
        .from('merchants')
        .update({ disbursement_schedule: schedule })
        .eq('id', merchant?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-disbursement'] });
      toast({ title: 'Schedule updated', description: 'Your disbursement schedule has been updated.' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update schedule.' });
    },
  });

  // Check if merchant is verified
  const isVerified = merchantData?.verification_status === 'verified';

  // Request on-demand disbursement - calls Xendit edge function
  const requestDisbursement = useMutation({
    mutationFn: async () => {
      if (!escrowAccount?.id || !merchant?.id) {
        throw new Error('Missing escrow account information');
      }
      
      if (!bankAccount?.id) {
        throw new Error('Please add a primary bank account before requesting disbursement');
      }

      // Verify bank account details are complete
      if (!bankAccount.account_number || !bankAccount.bank_name || !bankAccount.account_name) {
        throw new Error('Bank account details are incomplete. Please update your bank account information.');
      }
      
      const balance = escrowAccount.balance || 0;
      const minAmount = merchantData?.min_disbursement_amount || MINIMUM_PAYOUT_AMOUNT;

      if (balance < minAmount) {
        throw new Error(`Minimum disbursement amount is ${formatCurrency(minAmount)}. Current balance: ${formatCurrency(balance)}`);
      }

      // Calculate fee using centralized function
      const feeAmount = calculateDisbursementFee(balance, 'on_demand');
      const netAmount = balance - feeAmount;

      // If not verified, create disbursement with manual review flag
      if (!isVerified) {
        const { error } = await supabase
          .from('disbursements')
          .insert({
            escrow_account_id: escrowAccount.id,
            bank_account_id: bankAccount.id,
            amount: balance,
            fee_amount: feeAmount,
            net_amount: netAmount,
            type: 'on_demand',
            status: 'pending_review',
            requires_manual_review: true,
            scheduled_for: new Date().toISOString(),
          });

        if (error) throw error;

        // Create notification for admins
        await supabase.from('notifications').insert({
          user_id: user?.id || '',
          title: 'Disbursement Pending Review',
          message: 'Your disbursement request requires manual review and will be processed within 1-3 business days.',
          type: 'payment',
          link: '/merchant/escrow',
        });

        return { requires_review: true };
      }

      // Verified merchants - call Xendit disbursement edge function
      const { data, error } = await supabase.functions.invoke('xendit-disbursement', {
        body: {
          escrow_account_id: escrowAccount.id,
          bank_account_id: bankAccount.id,
          amount: balance,
          type: 'on_demand',
          description: 'On-demand disbursement request',
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Disbursement failed');

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['escrow-account'] });
      queryClient.invalidateQueries({ queryKey: ['escrow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-disbursement'] });
      setDisbursementDialogOpen(false);
      
      if (data?.requires_review) {
        toast({ 
          title: 'Disbursement Pending Review', 
          description: 'Your request requires manual review and will be processed within 1-3 business days.' 
        });
      } else {
        toast({ 
          title: 'Disbursement Processing', 
          description: 'Your funds are being transferred. You will receive a confirmation shortly.' 
        });
      }
    },
    onError: (error: Error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message || 'Failed to request disbursement.' 
      });
    },
  });

  const balance = escrowAccount?.balance || 0;
  const feeAmount = calculateDisbursementFee(balance, 'on_demand');
  const netAmount = balance - feeAmount;
  const minDisbursementAmount = merchantData?.min_disbursement_amount || MINIMUM_PAYOUT_AMOUNT;

  if (loadingAccount) {
    return (
      <MerchantLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Escrow Account</h1>
          <p className="text-muted-foreground">Manage your escrow balance and disbursements</p>
        </div>

        {/* Non-verified merchant warning */}
        {!isVerified && (
          <Alert variant="destructive" className="border-warning bg-warning/10">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Verification Required</AlertTitle>
            <AlertDescription>
              Your account is not verified. Disbursement requests will require manual review and may take 1-3 business days to process.
            </AlertDescription>
          </Alert>
        )}

        {/* Balance Cards */}
        <EscrowBalanceCards 
          balance={escrowAccount?.balance || 0}
          pendingBalance={escrowAccount?.pending_balance || 0}
          totalDisbursed={merchantData?.total_disbursed || 0}
          lastDisbursementDate={merchantData?.last_disbursement_date}
        />

        {/* On-Demand Disbursement */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Request Disbursement Now
            </CardTitle>
            <CardDescription>
              Get your available balance transferred immediately with a 0.5% fee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Available for Disbursement</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(balance)}</p>
                {balance > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Fee: {formatCurrency(feeAmount)} • You receive: {formatCurrency(netAmount)}
                  </p>
                )}
              </div>
              <Button 
                onClick={() => setDisbursementDialogOpen(true)}
                disabled={balance <= 0 || !bankAccount}
                className="gradient-primary"
              >
                <Send className="h-4 w-4 mr-2" />
                Request Now
              </Button>
            </div>
            {balance > 0 && balance < minDisbursementAmount && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Minimum disbursement amount is {formatCurrency(minDisbursementAmount)}. Current balance: {formatCurrency(balance)}
                </AlertDescription>
              </Alert>
            )}
            {!bankAccount && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Bank Account Required</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>Please add a primary bank account before requesting disbursement.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/merchant/settings?tab=bank')}
                    className="ml-2"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Disbursement Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Disbursement Schedule
            </CardTitle>
            <CardDescription>
              Choose when you want to receive your funds automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Current Schedule</label>
                <Select 
                  value={merchantData?.disbursement_schedule || 'weekly'}
                  onValueChange={(value) => updateSchedule.mutate(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISBURSEMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {option.fee}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {DISBURSEMENT_OPTIONS.find(o => o.value === (merchantData?.disbursement_schedule || 'weekly'))?.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {DISBURSEMENT_OPTIONS.find(o => o.value === (merchantData?.disbursement_schedule || 'weekly'))?.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent escrow transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <EscrowFilters 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              className="mb-6"
            />
            
            <EscrowTransactionsTable
              transactions={transactions}
              loading={loadingTransactions}
              page={transactionPage}
              totalPages={totalPages}
              totalTransactions={totalTransactions}
              onPageChange={setTransactionPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </CardContent>
        </Card>

        <DisbursementDialog
          open={disbursementDialogOpen}
          onOpenChange={setDisbursementDialogOpen}
          balance={balance}
          feeAmount={feeAmount}
          netAmount={netAmount}
          bankAccount={bankAccount}
          onConfirm={() => requestDisbursement.mutate()}
          isLoading={requestDisbursement.isPending}
          onAddBankAccount={() => navigate('/merchant/settings?tab=bank')}
        />
      </div>
    </MerchantLayout>
  );
}
