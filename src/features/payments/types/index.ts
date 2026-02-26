export interface PaymentPlan {
  id: string;
  invoice_id: string;
  tenant_user_id: string;
  merchant_id: string;
  original_amount: number;
  plan_type: 'installments' | 'deferred';
  installment_count: number;
  installment_amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  start_date: string;
  late_fee_waived: boolean;
  waived_amount: number;
  status: 'pending_acceptance' | 'active' | 'accepted' | 'completed' | 'defaulted' | 'cancelled';
  terms: string | null;
  created_at?: string;
  invoice?: {
    invoice_number: string;
  };
  installments?: PaymentPlanInstallment[];
}

export interface PaymentPlanInstallment {
  id: string;
  payment_plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_at?: string | null;
}

export interface CreatePaymentPlanPayload {
  invoice_id: string;
  tenant_user_id: string;
  merchant_id: string;
  original_amount: number;
  plan_type: 'installments' | 'deferred';
  installment_count: number;
  installment_amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  start_date: string;
  late_fee_waived: boolean;
  waived_amount: number;
  status: 'pending_acceptance';
  terms: string;
  installments: Omit<PaymentPlanInstallment, 'id' | 'payment_plan_id'>[];
  invoice_number: string; // For notification
}

export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount?: number;
  total_amount: number;
  status: 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid';
  due_date: string;
  late_fee: number;
  paid_at?: string | null;
  tenant_user_id: string;
  merchant_id: string;
  contract_id: string;
  created_at?: string;
  description?: string | null;
  issued_at?: string | null;
  original_amount?: number | null;
  late_fee_applied_at?: string | null;
  grace_period_active?: boolean | null;
  overdue_since?: string | null;
}

export interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  payment_method: string | null;
  reference: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'failed';
  due_date: string;
  paid_at: string | null;
  created_at: string;
  contract_id: string;
  tenant_user_id: string;
  merchant_id: string;
  proof_photo_url?: string | null;
}
