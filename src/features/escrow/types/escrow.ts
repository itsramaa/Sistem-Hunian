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
    min_disbursement_amount: number;
  };
}

export interface EscrowTransaction {
  id: string;
  escrow_account_id: string;
  amount: number;
  type: string;
  status: string | null;
  description: string | null;
  reference: string | null;
  contract_id: string | null;
  gross_amount: number | null;
  platform_fee: number | null;
  gateway_fee: number | null;
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
  net_amount: number;
  fee_amount: number | null;
  status: string;
  type: string;
  requires_manual_review: boolean | null;
  review_notes: string | null;
  escrow_account_id: string | null;
  bank_account_id: string | null;
  created_at: string;
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

export interface EscrowFilters {
  status?: string;
  type?: string;
  search?: string;
}

export interface DisbursementParams {
  accountId: string;
  amount: number;
  description?: string;
}

export interface ReviewDisbursementParams {
  id: string;
  status?: string;
  amount?: number;
  escrow_account_id?: string;
  bank_account_id?: string;
  merchant_id?: string;
  notes?: string;
  user_id?: string;
  business_name?: string;
}
