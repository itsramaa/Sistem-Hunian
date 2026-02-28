import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";

export interface WizardNotice {
  id: string;
  contract_id: string;
  tenant_user_id: string;
  intended_move_out_date: string;
  reason: string;
  is_early_termination: boolean;
  status: string;
  created_at: string;
  contract: {
    id: string;
    rent_amount: number;
    deposit_amount: number | null;
    merchant_id: string;
    tenant_user_id: string;
    status: string | null;
    unit: {
      id: string;
      unit_number: string;
      property: {
        id: string;
        name: string;
        address: string;
        city: string;
      } | null;
    } | null;
  } | null;
}

export interface WizardInspection {
  id: string;
  move_out_notice_id: string;
  status: string;
  scheduled_date: string | null;
  completed_at: string | null;
  inspection_report: Record<string, unknown> | null;
  total_deductions: number | null;
  deposit_refund_amount: number | null;
  deduction_details: Record<string, unknown>[] | null;
  inspector_signature: string | null;
  tenant_signature: string | null;
}

export interface WizardDepositRefund {
  id: string;
  contract_id: string;
  tenant_user_id: string;
  original_deposit: number;
  deductions: number | null;
  deduction_details: Record<string, unknown>[] | null;
  refund_amount: number;
  status: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  account_holder_name: string | null;
  due_date: string | null;
  refunded_at: string | null;
}

export interface WizardEarlyTermRequest {
  id: string;
  contract_id: string;
  tenant_user_id: string;
  requested_date: string;
  penalty_amount: number;
  reason: string;
  status: string;
  merchant_response: string | null;
  counter_offer_amount: number | null;
  supporting_docs: Record<string, unknown>[] | null;
}

export interface WizardTenantProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export const useMoveOutWizardData = (noticeId: string | undefined) => {
  // 1. Fetch the notice with contract/unit/property joins
  const {
    data: notice,
    isLoading: isLoadingNotice,
    refetch: refetchNotice,
  } = useQuery({
    queryKey: ["wizard-notice", noticeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("move_out_notices")
        .select(`*, contract:contracts(id, rent_amount, deposit_amount, merchant_id, tenant_user_id, status, unit:units(id, unit_number, property:properties(id, name, address, city)))`)
        .eq("id", noticeId!)
        .single();
      if (error) throw error;
      return data as unknown as WizardNotice;
    },
    enabled: !!noticeId,
  });

  // 2. Fetch inspection
  const {
    data: inspection,
    isLoading: isLoadingInspection,
    refetch: refetchInspection,
  } = useQuery({
    queryKey: ["wizard-inspection", noticeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("move_out_inspections")
        .select("*")
        .eq("move_out_notice_id", noticeId!)
        .maybeSingle();
      return (data as unknown as WizardInspection) || null;
    },
    enabled: !!noticeId,
  });

  // 3. Fetch deposit refund
  const {
    data: depositRefund,
    isLoading: isLoadingDeposit,
    refetch: refetchDeposit,
  } = useQuery({
    queryKey: ["wizard-deposit-refund", notice?.contract_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("deposit_refunds")
        .select("*")
        .eq("contract_id", notice!.contract_id)
        .maybeSingle();
      return (data as unknown as WizardDepositRefund) || null;
    },
    enabled: !!notice?.contract_id,
  });

  // 4. Fetch early termination request
  const {
    data: earlyTermRequest,
    isLoading: isLoadingEarlyTerm,
    refetch: refetchEarlyTerm,
  } = useQuery({
    queryKey: ["wizard-early-term", notice?.contract_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("early_termination_requests")
        .select("*")
        .eq("contract_id", notice!.contract_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as unknown as WizardEarlyTermRequest) || null;
    },
    enabled: !!notice?.contract_id,
  });

  // 5. Fetch tenant profile
  const {
    data: tenantProfile,
    isLoading: isLoadingProfile,
  } = useQuery({
    queryKey: ["wizard-tenant-profile", notice?.tenant_user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .eq("user_id", notice!.tenant_user_id)
        .single();
      return (data as unknown as WizardTenantProfile) || null;
    },
    enabled: !!notice?.tenant_user_id,
  });

  // 6. Fetch outstanding invoices for the contract
  const {
    data: outstandingInvoices,
    isLoading: isLoadingInvoices,
  } = useQuery({
    queryKey: ["wizard-outstanding-invoices", notice?.contract_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount, total_amount, status, due_date")
        .eq("contract_id", notice!.contract_id)
        .in("status", ["pending", "overdue"]);
      return data || [];
    },
    enabled: !!notice?.contract_id,
  });

  // Derive step completion from DB state
  const noticeAcknowledged = notice?.status !== "submitted";
  const inspectionCompleted = inspection?.status === "completed";
  const depositSettled = depositRefund?.status === "approved" || depositRefund?.status === "processing" || depositRefund?.status === "completed";
  const contractTerminated = notice?.contract?.status === "terminated" || notice?.contract?.status === "terminated_early";
  const step3Complete = (depositSettled || false) && (contractTerminated || false);

  const refetchAll = async () => {
    await Promise.all([
      refetchNotice(),
      refetchInspection(),
      refetchDeposit(),
      refetchEarlyTerm(),
    ]);
  };

  return {
    notice,
    inspection,
    depositRefund,
    earlyTermRequest,
    tenantProfile,
    outstandingInvoices,
    isLoading: isLoadingNotice || isLoadingInspection || isLoadingDeposit || isLoadingEarlyTerm || isLoadingProfile || isLoadingInvoices,
    refetchAll,
    // Step completion flags
    noticeAcknowledged,
    inspectionCompleted,
    depositSettled,
    contractTerminated,
    step3Complete,
  };
};
