import { supabase } from "@/lib/integrations/supabase/client";
import { createAuditLog } from "@/shared/utils/auditLog";
import {
  DisbursementParams,
  EscrowAccount,
  EscrowFilters,
  EscrowTransaction,
  PendingDisbursement,
  ReviewDisbursementParams
} from "../types/escrow";

export const escrowService = {
  fetchEscrowAccounts: async (): Promise<EscrowAccount[]> => {
    const { data, error } = await supabase
      .from('escrow_accounts')
      .select('*, merchants:merchant_id(business_name, user_id, min_disbursement_amount)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    type EscrowAccountResponse = Omit<EscrowAccount, 'merchant'> & {
      merchants: {
        business_name: string;
        user_id: string;
        min_disbursement_amount: number;
      } | null;
    };

    const accounts = (data || []) as unknown as EscrowAccountResponse[];

    return accounts.map((acc) => ({
      ...acc,
      merchant: acc.merchants ? {
        business_name: acc.merchants.business_name,
        user_id: acc.merchants.user_id,
        min_disbursement_amount: acc.merchants.min_disbursement_amount,
      } : undefined
    })) as unknown as EscrowAccount[];
  },

  fetchTransactions: async (page: number, pageSize: number, filters?: EscrowFilters): Promise<{ data: EscrowTransaction[], count: number }> => {
    const offset = (page - 1) * pageSize;
    
    let query = supabase
      .from('escrow_transactions')
      .select('*, escrow_accounts:escrow_account_id(merchants:merchant_id(business_name))', { count: 'exact' });

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters?.search) {
      // Search in description, reference, or merchant name
      // Note: searching across joined tables is tricky in Supabase/PostgREST.
      // We'll focus on direct fields for now, or use a workaround if needed.
      // For simplified search:
      query = query.or(`description.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    type EscrowTransactionResponse = Omit<EscrowTransaction, 'escrow_account'> & {
      escrow_accounts: {
        merchants: {
          business_name: string;
        } | null;
      } | null;
    };

    const transactionsRaw = (data || []) as unknown as EscrowTransactionResponse[];

    const transactions = transactionsRaw.map((tx) => ({
      ...tx,
      escrow_account: tx.escrow_accounts ? {
        merchant: tx.escrow_accounts.merchants ? {
          business_name: tx.escrow_accounts.merchants.business_name
        } : undefined
      } : undefined
    })) as unknown as EscrowTransaction[];

    return { data: transactions, count: count || 0 };
  },

  fetchPendingReviews: async (): Promise<PendingDisbursement[]> => {
    const { data, error } = await supabase
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

    if (error) throw error;

    type PendingDisbursementResponse = Omit<PendingDisbursement, 'merchant' | 'bank_account'> & {
      escrow_accounts: {
        merchants: {
          id: string;
          business_name: string;
          user_id: string;
          verification_status: string;
        } | null;
      } | null;
      bank_accounts: {
        bank_name: string;
        account_number: string;
        account_name: string;
      } | null;
    };

    const pendingDisbursements = (data || []) as unknown as PendingDisbursementResponse[];

    return pendingDisbursements.map((d) => ({
      ...d,
      merchant: d.escrow_accounts?.merchants || undefined,
      bank_account: d.bank_accounts || undefined,
    })) as unknown as PendingDisbursement[];
  },

  processDisbursement: async (params: DisbursementParams, adminId: string): Promise<void> => {
    const { accountId, amount, description } = params;

    // Get current balance
    const { data: account, error: accError } = await supabase
      .from('escrow_accounts')
      .select('balance')
      .eq('id', accountId)
      .single();
    
    if (accError) throw accError;
    if (account.balance < amount) throw new Error('Insufficient balance');

    // Create transaction
    const { error: txError } = await supabase
      .from('escrow_transactions')
      .insert({
        escrow_account_id: accountId,
        amount: amount,
        type: 'disbursement',
        status: 'completed',
        description: description || 'Admin disbursement',
        processed_at: new Date().toISOString(),
      });

    if (txError) throw txError;

    // Update balance
    const { error: updateError } = await supabase
      .from('escrow_accounts')
      .update({ 
        balance: account.balance - amount,
      })
      .eq('id', accountId);

    if (updateError) throw updateError;

    // Log audit
    await createAuditLog({
      action: 'disbursement',
      entityType: 'escrow',
      entityId: accountId,
      oldData: { balance: account.balance },
      newData: { balance: account.balance - amount, disbursed: amount },
      userId: adminId,
    });
  },

  approveDisbursement: async (params: ReviewDisbursementParams, adminId: string): Promise<void> => {
    const { id, amount, escrow_account_id, bank_account_id, notes, user_id, business_name } = params;

    // Call edge function
    const { data, error } = await supabase.functions.invoke('xendit-disbursement', {
      body: {
        escrow_account_id,
        bank_account_id,
        amount,
        type: 'on_demand',
        description: `Approved manual review disbursement`,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Disbursement failed');

    // Update status
    await supabase
      .from('disbursements')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        review_notes: notes || 'Approved by admin',
      })
      .eq('id', id);

    // Log audit
    await createAuditLog({
      action: 'approve',
      entityType: 'disbursement',
      entityId: id,
      newData: { status: 'approved', amount },
      userId: adminId,
    });

    // Notify merchant
    if (user_id) {
      await supabase.from('notifications').insert({
        user_id,
        title: 'Disbursement Approved',
        message: `Your disbursement request of Rp ${(amount || 0).toLocaleString()} has been approved and is being processed.`,
        type: 'payment',
        link: '/merchant/escrow',
      });
    }
  },

  rejectDisbursement: async (params: ReviewDisbursementParams, adminId: string): Promise<void> => {
    const { id, notes, user_id, business_name } = params;

    // Update status
    await supabase
      .from('disbursements')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        review_notes: notes,
      })
      .eq('id', id);

    // Log audit
    await createAuditLog({
      action: 'reject',
      entityType: 'disbursement',
      entityId: id,
      newData: { status: 'rejected', reason: notes },
      userId: adminId,
    });

    // Notify merchant
    if (user_id) {
      await supabase.from('notifications').insert({
        user_id,
        title: 'Disbursement Rejected',
        message: `Your disbursement request was rejected. Reason: ${notes}. Your funds remain in your escrow account.`,
        type: 'payment',
        link: '/merchant/escrow',
      });
    }
  }
};
