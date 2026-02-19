import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { escrowService } from "../services/escrowService";
import { DisbursementParams, EscrowFilters, ReviewDisbursementParams } from "../types/escrow";

export function useEscrow(
  page: number = 1, 
  pageSize: number = 20, 
  isAdmin: boolean,
  filters?: EscrowFilters
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['admin-escrow-accounts'],
    queryFn: escrowService.fetchEscrowAccounts,
    enabled: isAdmin,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-escrow-transactions', page, pageSize, filters?.status, filters?.type, filters?.search],
    queryFn: () => escrowService.fetchTransactions(page, pageSize, filters),
    enabled: isAdmin,
    keepPreviousData: true,
  });

  const { data: pendingReviews = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-escrow-pending'],
    queryFn: escrowService.fetchPendingReviews,
    enabled: isAdmin,
  });

  const processDisbursementMutation = useMutation({
    mutationFn: async (params: DisbursementParams) => {
      if (!user?.id) throw new Error("User not authenticated");
      await escrowService.processDisbursement(params, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-escrow-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-escrow-transactions'] });
      toast.success('Disbursement processed successfully');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to process disbursement'),
  });

  const approveReviewMutation = useMutation({
    mutationFn: async (params: ReviewDisbursementParams) => {
      if (!user?.id) throw new Error("User not authenticated");
      await escrowService.approveDisbursement(params, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-escrow-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-escrow-transactions'] });
      toast.success('Disbursement approved');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to approve disbursement'),
  });

  const rejectReviewMutation = useMutation({
    mutationFn: async (params: ReviewDisbursementParams) => {
      if (!user?.id) throw new Error("User not authenticated");
      await escrowService.rejectDisbursement(params, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-escrow-pending'] });
      toast.success('Disbursement rejected');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to reject disbursement'),
  });

  return {
    accounts,
    transactions: transactionsData?.data || [],
    totalTransactions: transactionsData?.count || 0,
    pendingReviews,
    isLoading: accountsLoading || transactionsLoading || pendingLoading,
    processDisbursement: processDisbursementMutation,
    approveReview: approveReviewMutation,
    rejectReview: rejectReviewMutation,
  };
}
