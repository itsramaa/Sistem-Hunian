import { MINIMUM_PAYOUT_AMOUNT } from '@/constants/platformFees';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BankAccount } from '@/features/escrow/types';
import { calculateDisbursementFee } from '@/features/escrow/utils/disbursement';
import { supabase } from '@/lib/integrations/supabase/client';
import { useToast } from '@/shared/hooks/use-toast';
import { formatCurrency } from '@/shared/utils/currency';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export function useMerchantEscrow() {
  const { merchant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [transactionPage, setTransactionPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false);

  // Reset pagination when filters change
  useEffect(() => {
    setTransactionPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  // Fetch escrow account
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

  // Fetch merchant for disbursement schedule and stats
  const { data: merchantData } = useQuery({
    queryKey: ['merchant-disbursement', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return null;
      const { data, error } = await supabase
        .from('merchants')
        .select(`
          verification_status, 
          total_disbursed, 
          last_disbursement_date, 
          min_disbursement_amount,
          merchant_subscriptions(disbursement_schedule)
        `)
        .eq('id', merchant.id)
        .maybeSingle();
      if (error) throw error;
      
      return {
        ...data,
        disbursement_schedule: (data?.merchant_subscriptions?.[0] as any)?.disbursement_schedule || null
      };
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

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    let result = allTransactions || [];
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
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
  }, [allTransactions, searchQuery, statusFilter, typeFilter]);

  // Client-side pagination
  const transactions = useMemo(() => {
    const start = (transactionPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, transactionPage]);

  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);

  // Update disbursement schedule
  const updateSchedule = useMutation({
    mutationFn: async (schedule: string) => {
      const { error } = await supabase
        .from('merchant_subscriptions')
        .update({ disbursement_schedule: schedule } as any)
        .eq('merchant_id', merchant?.id);
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

  const isVerified = merchantData?.verification_status === 'verified';
  const balance = escrowAccount?.balance || 0;
  const feeAmount = calculateDisbursementFee(balance, 'on_demand');
  const netAmount = balance - feeAmount;
  const minDisbursementAmount = merchantData?.min_disbursement_amount || MINIMUM_PAYOUT_AMOUNT;

  // Request on-demand disbursement
  const requestDisbursement = useMutation({
    mutationFn: async () => {
      if (!escrowAccount?.id || !merchant?.id) {
        throw new Error('Missing escrow account information');
      }
      if (!bankAccount?.id) {
        throw new Error('Please add a primary bank account before requesting disbursement');
      }
      if (!bankAccount.account_number || !bankAccount.bank_name || !bankAccount.account_name) {
        throw new Error('Bank account details are incomplete. Please update your bank account information.');
      }

      if (balance < minDisbursementAmount) {
        throw new Error(`Minimum disbursement amount is ${formatCurrency(minDisbursementAmount)}. Current balance: ${formatCurrency(balance)}`);
      }

      const currentFee = calculateDisbursementFee(balance, 'on_demand');
      const currentNet = balance - currentFee;

      if (!isVerified) {
        const { error } = await supabase
          .from('disbursements')
          .insert({
            escrow_account_id: escrowAccount.id,
            bank_account_id: bankAccount.id,
            amount: balance,
            fee_amount: currentFee,
            net_amount: currentNet,
            type: 'on_demand',
            status: 'pending_review',
            requires_manual_review: true,
            scheduled_for: new Date().toISOString(),
          });
        if (error) throw error;

        await supabase.from('notifications').insert({
          user_id: user?.id || '',
          title: 'Disbursement Pending Review',
          message: 'Your disbursement request requires manual review and will be processed within 1-3 business days.',
          type: 'payment',
          link: '/merchant/escrow',
        });

        return { requires_review: true };
      }

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

  return {
    // Data
    escrowAccount,
    merchantData,
    bankAccount,
    transactions,
    filteredTransactions,
    totalTransactions,
    totalPages,
    balance,
    feeAmount,
    netAmount,
    minDisbursementAmount,
    isVerified,

    // Loading states
    loadingAccount,
    loadingTransactions,

    // Filters
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    transactionPage, setTransactionPage,
    disbursementDialogOpen, setDisbursementDialogOpen,

    // Mutations
    updateSchedule,
    requestDisbursement,

    ITEMS_PER_PAGE,
  };
}
