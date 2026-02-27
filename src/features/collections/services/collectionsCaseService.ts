import { supabase } from '@/integrations/supabase/client';
import { isValidTransition, COLLECTIONS_CASE_TRANSITIONS } from '@/shared/constants/state-machines';

export interface CollectionsCase {
  id: string;
  invoiceId: string;
  merchantId: string;
  tenantUserId: string;
  totalDue: number;
  daysOverdue: number;
  status: string;
  escalationLevel: number;
  resolutionType: string | null;
  notes: string | null;
  lastContactAt: string | null;
  nextActionDate: string | null;
  createdAt: string;
  // joined
  invoiceNumber?: string;
  tenantName?: string;
  unitNumber?: string;
}

export const collectionsCaseService = {
  async fetchCases(merchantId: string, status?: string): Promise<CollectionsCase[]> {
    let query = supabase
      .from('collections_cases')
      .select('*, invoices(invoice_number, unit_number, tenant_name)')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      invoiceId: r.invoice_id,
      merchantId: r.merchant_id,
      tenantUserId: r.tenant_user_id,
      totalDue: Number(r.total_due),
      daysOverdue: r.days_overdue,
      status: r.status,
      escalationLevel: r.escalation_level,
      resolutionType: r.resolution_type,
      notes: r.notes,
      lastContactAt: r.last_contact_at,
      nextActionDate: r.next_action_date,
      createdAt: r.created_at,
      invoiceNumber: r.invoices?.invoice_number || '-',
      tenantName: r.invoices?.tenant_name || '-',
      unitNumber: r.invoices?.unit_number || '-',
    }));
  },

  async updateCaseStatus(caseId: string, currentStatus: string, newStatus: string, resolution?: string): Promise<void> {
    if (!isValidTransition(COLLECTIONS_CASE_TRANSITIONS, currentStatus, newStatus)) {
      throw new Error(`Transisi tidak valid: ${currentStatus} → ${newStatus}`);
    }

    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
      updates.resolution_type = resolution || 'paid_in_full';
    }

    const { error } = await supabase.from('collections_cases').update(updates).eq('id', caseId);
    if (error) throw error;
  },

  async createPaymentPlan(payload: {
    invoiceId: string;
    tenantUserId: string;
    merchantId: string;
    totalAmount: number;
    installmentCount: number;
    frequency: string;
    startDate: string;
  }): Promise<void> {
    const installmentAmount = Math.ceil(payload.totalAmount / payload.installmentCount);
    const { error } = await supabase.from('payment_plans').insert({
      invoice_id: payload.invoiceId,
      tenant_user_id: payload.tenantUserId,
      merchant_id: payload.merchantId,
      original_amount: payload.totalAmount,
      installment_amount: installmentAmount,
      installment_count: payload.installmentCount,
      frequency: payload.frequency,
      start_date: payload.startDate,
      status: 'pending_acceptance',
    });
    if (error) throw error;
  },

  async fetchInteractions(caseId: string) {
    const { data, error } = await supabase
      .from('collections_interactions')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      caseId: r.case_id,
      merchantId: r.merchant_id,
      interactionType: r.interaction_type,
      direction: r.direction,
      outcome: r.outcome,
      notes: r.notes,
      contactPerson: r.contact_person,
      followUpDate: r.follow_up_date,
      createdBy: r.created_by,
      createdAt: r.created_at,
    }));
  },

  async addInteraction(caseId: string, merchantId: string, data: {
    interactionType: string;
    direction: string;
    outcome: string;
    notes: string;
    contactPerson: string;
    followUpDate: string | null;
  }) {
    const { error } = await supabase.from('collections_interactions').insert({
      case_id: caseId,
      merchant_id: merchantId,
      interaction_type: data.interactionType,
      direction: data.direction,
      outcome: data.outcome || null,
      notes: data.notes || null,
      contact_person: data.contactPerson || null,
      follow_up_date: data.followUpDate || null,
    });
    if (error) throw error;
  },
};
