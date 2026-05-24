// Shared contract-related types (moved from features/contracts after feature removal)

export interface ContractUnit {
  id?: string;
  unit_number: string;
  property: {
    id?: string;
    name: string;
    address: string;
    city?: string;
  } | null;
}

export interface Contract {
  id: string;
  tenant_user_id: string;
  merchant_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number | null;
  status: 'active' | 'pending' | 'expired' | 'terminated' | 'cancelled' | 'notice' | 'draft' | 'completed';
  terms: string | null;
  signature_status: string | null;
  tenant_signature_url: string | null;
  tenant_signed_at: string | null;
  merchant_signature_url: string | null;
  merchant_signed_at: string | null;
  contract_document_url: string | null;
  move_out_notice_given: boolean | null;
  notice_period_days: number | null;
  early_termination_penalty_rate: number | null;
  created_at: string;
  updated_at: string;
  unit: ContractUnit | null;
}

export interface CreateContractPayload {
  merchant_id: string;
  unit_id: string;
  tenant_user_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  payment_frequency?: 'monthly' | 'semester' | 'annual';
  billing_day?: number | null;
  terms?: string | null;
  status: 'draft' | 'active' | 'pending' | 'notice' | 'completed' | 'terminated' | 'expired';
}

export interface MoveOutNotice {
  id: string;
  contract_id: string;
  tenant_user_id: string;
  intended_move_out_date: string;
  reason: string;
  is_early_termination?: boolean;
  status: string;
  contract: {
    id: string;
    rent_amount: number;
    deposit_amount: number;
    merchant_id: string;
    tenant_user_id: string;
    unit: {
      unit_number: string;
      property: {
        name: string;
        address: string;
      } | null;
    } | null;
  };
}

export interface MoveOutInspection {
  id: string;
  move_out_notice_id: string;
  status: 'scheduled' | 'completed' | 'pending';
  scheduled_date: string | null;
  notes: string | null;
  inspector_name?: string;
}

export interface EarlyTerminationRequest {
  id: string;
  contract_id: string;
  tenant_user_id: string;
  requested_date: string;
  penalty_amount: number;
  reason: string;
  status: string;
  merchant_response?: string;
  approved_at?: string;
  denied_at?: string;
  counter_offer_amount?: number;
  supporting_docs?: Record<string, unknown>[];
  contract?: {
    id: string;
    rent_amount: number;
    merchant_id: string;
    unit?: {
      unit_number: string;
      property?: {
        name: string;
      } | null;
    } | null;
  };
}

export interface TenantProfile {
  user_id: string;
  full_name: string | null;
  email: string;
}
