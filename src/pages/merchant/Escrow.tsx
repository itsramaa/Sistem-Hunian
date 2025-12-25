import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Calendar, Loader2, Info, Send, AlertCircle, ShieldAlert, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const DISBURSEMENT_OPTIONS = [
  { value: 'daily', label: 'Daily', fee: '0.25%', description: 'Receive funds daily with 0.25% fee' },
  { value: 'weekly', label: 'Weekly', fee: 'Free', description: 'Receive funds every Monday, no fee' },
  { value: 'monthly', label: 'Monthly', fee: 'Free', description: 'Receive funds on the 1st, no fee' },
  { value: 'on_demand', label: 'On Demand', fee: '0.5%', description: 'Request anytime with 0.5% fee' },
];

const ON_DEMAND_FEE_RATE = 0.005; // 0.5%

export default function MerchantEscrow() {
  const { merchant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false);

  // Fetch escrow account
  const { data: escrowAccount, isLoading: loadingAccount } = useQuery({
    queryKey: ['escrow-account', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return null;
      const { data, error } = await supabase
        .from('escrow_accounts')
        .select('*')
        .eq('merchant_id', merchant.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['escrow-transactions', escrowAccount?.id],
    queryFn: async () => {
      if (!escrowAccount?.id) return [];
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('escrow_account_id', escrowAccount.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!escrowAccount?.id,
  });

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
      return data;
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
      if (!escrowAccount?.id || !bankAccount?.id || !merchant?.id) {
        throw new Error('Missing account info');
      }
      
      const balance = escrowAccount.balance || 0;
      const minAmount = merchantData?.min_disbursement_amount || 100000;

      if (balance < minAmount) {
        throw new Error(`Minimum disbursement amount is Rp ${minAmount.toLocaleString()}`);
      }

      // If not verified, create disbursement with manual review flag
      if (!isVerified) {
        const feeAmount = balance * ON_DEMAND_FEE_RATE;
        const netAmount = balance - feeAmount;

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

        // Create notification for admins (using a general admin notification approach)
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const balance = escrowAccount?.balance || 0;
  const feeAmount = balance * ON_DEMAND_FEE_RATE;
  const netAmount = balance - feeAmount;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-600 border-green-200',
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      processing: 'bg-blue-500/10 text-blue-600 border-blue-200',
    };
    return (
      <Badge variant="outline" className={styles[status] || 'bg-muted'}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const isDeposit = type === 'deposit' || type === 'payment_received';
    return (
      <div className={`flex items-center gap-1 ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>
        {isDeposit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        <span className="capitalize">{type.replace('_', ' ')}</span>
      </div>
    );
  };

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
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(escrowAccount?.balance || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Balance</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {formatCurrency(escrowAccount?.pending_balance || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Awaiting clearance (usually 1-3 business days)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Disbursed</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(merchantData?.total_disbursed || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              {merchantData?.last_disbursement_date && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last: {format(new Date(merchantData.last_disbursement_date), 'dd MMM yyyy')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency((escrowAccount?.balance || 0) + (escrowAccount?.pending_balance || 0))}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
            {!bankAccount && (
              <p className="text-sm text-warning mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Please add a primary bank account in Settings before requesting disbursement.
              </p>
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
            {loadingTransactions ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(tx.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>{getTypeBadge(tx.type)}</TableCell>
                        <TableCell>{tx.description || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {tx.reference || '-'}
                        </TableCell>
                        <TableCell className={`font-medium ${
                          tx.type === 'deposit' || tx.type === 'payment_received' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {tx.type === 'deposit' || tx.type === 'payment_received' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(tx.status || 'pending')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* On-Demand Disbursement Confirmation Dialog */}
      <Dialog open={disbursementDialogOpen} onOpenChange={setDisbursementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Disbursement Request</DialogTitle>
            <DialogDescription>
              You're about to request an immediate transfer of your available balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-xl font-bold">{formatCurrency(balance)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Fee (0.5%)</p>
                <p className="text-xl font-bold text-destructive">-{formatCurrency(feeAmount)}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground">You will receive</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(netAmount)}</p>
            </div>
            {bankAccount && (
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Transfer to</p>
                <p className="font-medium">{bankAccount.bank_name} - {bankAccount.account_number}</p>
                <p className="text-sm text-muted-foreground">{bankAccount.account_name}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisbursementDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => requestDisbursement.mutate()}
              disabled={requestDisbursement.isPending}
              className="gradient-primary"
            >
              {requestDisbursement.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm Disbursement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
}
