export interface EscrowAccount {
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

export interface EscrowTransaction {
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

export interface PendingDisbursement {
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

export interface EscrowStats {
  totalBalance: number;
  totalPending: number;
  activeAccounts: number;
  transactionsToday: number;
}

export interface EscrowResponse {
  accounts: EscrowAccount[];
  transactions: EscrowTransaction[];
  pendingReviews: PendingDisbursement[];
  totalTransactions: number;
}

export interface DisbursementParams {
  accountId: string;
  amount: number;
  description: string;
}

export interface ReviewDisbursementParams {
  id: string;
  status: 'approved' | 'rejected';
  notes?: string;
  amount?: number;
  escrow_account_id?: string;
  bank_account_id?: string;
  merchant_id?: string;
  user_id?: string;
  business_name?: string;
}

export interface EscrowFilters {
  search?: string;
  status?: string;
  type?: string;
}

export interface BankAccount {
  id: string;
  merchant_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_code: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}
