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
import { useToast } from '@/hooks/use-toast';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Calendar, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';

const DISBURSEMENT_OPTIONS = [
  { value: 'daily', label: 'Daily', fee: '0.25%', description: 'Receive funds daily with 0.25% fee' },
  { value: 'weekly', label: 'Weekly', fee: 'Free', description: 'Receive funds every Monday, no fee' },
  { value: 'monthly', label: 'Monthly', fee: 'Free', description: 'Receive funds on the 1st, no fee' },
  { value: 'on_demand', label: 'On Demand', fee: '0.5%', description: 'Request anytime with 0.5% fee' },
];

export default function MerchantEscrow() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch merchant for disbursement schedule
  const { data: merchantData } = useQuery({
    queryKey: ['merchant-disbursement', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return null;
      const { data, error } = await supabase
        .from('merchants')
        .select('disbursement_schedule')
        .eq('id', merchant.id)
        .single();
      if (error) throw error;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

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

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4">
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
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency((escrowAccount?.balance || 0) + (escrowAccount?.pending_balance || 0))}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disbursement Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Disbursement Schedule
            </CardTitle>
            <CardDescription>
              Choose when you want to receive your funds
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
    </MerchantLayout>
  );
}
