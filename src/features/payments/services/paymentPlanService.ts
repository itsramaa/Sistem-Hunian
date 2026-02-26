import { supabase } from '@/lib/integrations/supabase/client';
import { CreatePaymentPlanPayload, PaymentPlan } from '../types';
import { PAYMENT_PLAN_STATUS_TRANSITIONS, isValidTransition } from '@/shared/constants/state-machines';
import { logStatusChange, createAuditLog } from '@/shared/utils/auditLog';

export const paymentPlanService = {
  async getTenantPaymentPlans(tenantId: string, statuses?: string[]): Promise<PaymentPlan[]> {
    let query = supabase
      .from('payment_plans')
      .select(`
        *,
        invoice:invoices(invoice_number),
        installments:payment_plan_installments(*)
      `)
      .eq('tenant_user_id', tenantId)
      .order('created_at', { ascending: false });

    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as PaymentPlan[];
  },

  async createPaymentPlan(payload: CreatePaymentPlanPayload): Promise<PaymentPlan> {
    const { installments, invoice_number, ...planData } = payload;
    
    // Create plan
    const { data: plan, error: planError } = await supabase
      .from('payment_plans')
      .insert(planData)
      .select()
      .single();

    if (planError) throw planError;

    // Create installments
    const installmentsData = installments.map(inst => ({
      ...inst,
      payment_plan_id: plan.id
    }));

    const { error: installmentsError } = await supabase
      .from('payment_plan_installments')
      .insert(installmentsData);

    if (installmentsError) {
      // Rollback plan creation if installments fail
      await supabase.from('payment_plans').delete().eq('id', plan.id);
      throw installmentsError;
    }

    // Create notification for merchant
    await supabase.from('notifications').insert({
      user_id: payload.merchant_id,
      title: 'Permintaan Cicilan Baru',
      message: `Penyewa mengajukan rencana cicilan untuk invoice #${invoice_number}`,
      type: 'payment_plan',
      reference_id: plan.id,
      is_read: false
    });

    // Audit log for creation
    await createAuditLog({
      action: 'create',
      entityType: 'payment_plan',
      entityId: plan.id,
      newData: { invoice_id: payload.invoice_id, installment_count: installments.length },
    });

    return plan as unknown as PaymentPlan;
  },

  async acceptPaymentPlan(planId: string, invoiceId: string): Promise<void> {
    // Fetch current status
    const { data: current, error: fetchError } = await supabase
      .from('payment_plans')
      .select('status')
      .eq('id', planId)
      .single();

    if (fetchError) throw fetchError;
    const currentStatus = current?.status || 'pending_acceptance';

    if (!isValidTransition(PAYMENT_PLAN_STATUS_TRANSITIONS, currentStatus, 'active')) {
      throw new Error(`Invalid payment plan transition: ${currentStatus} → active`);
    }

    const { error } = await supabase
      .from('payment_plans')
      .update({ status: 'active' })
      .eq('id', planId);

    if (error) throw error;

    await logStatusChange('payment_plan', planId, currentStatus, 'active');
  },

  async declinePaymentPlan(planId: string): Promise<void> {
    // Fetch current status
    const { data: current, error: fetchError } = await supabase
      .from('payment_plans')
      .select('status')
      .eq('id', planId)
      .single();

    if (fetchError) throw fetchError;
    const currentStatus = current?.status || 'pending_acceptance';

    if (!isValidTransition(PAYMENT_PLAN_STATUS_TRANSITIONS, currentStatus, 'cancelled')) {
      throw new Error(`Invalid payment plan transition: ${currentStatus} → cancelled`);
    }

    const { error } = await supabase
      .from('payment_plans')
      .update({ status: 'cancelled' })
      .eq('id', planId);

    if (error) throw error;

    await logStatusChange('payment_plan', planId, currentStatus, 'cancelled');
  }
};
