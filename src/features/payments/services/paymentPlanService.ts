import { supabase } from '@/lib/integrations/supabase/client';
import { CreatePaymentPlanPayload, PaymentPlan } from '../types';

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

    // Update invoice with payment plan reference
    await supabase
      .from('invoices')
      .update({ payment_plan_id: plan.id })
      .eq('id', payload.invoice_id);

    // Create notification for merchant
    await supabase.from('notifications').insert({
      user_id: payload.merchant_id,
      title: 'Permintaan Cicilan Baru',
      message: `Penyewa mengajukan rencana cicilan untuk invoice #${invoice_number}`,
      type: 'payment_plan',
      reference_id: plan.id,
      is_read: false
    });

    return plan as unknown as PaymentPlan;
  },

  async acceptPaymentPlan(planId: string, invoiceId: string): Promise<void> {
    const { error } = await supabase
      .from('payment_plans')
      .update({ status: 'active' })
      .eq('id', planId);

    if (error) throw error;
  },

  async declinePaymentPlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('payment_plans')
      .update({ status: 'cancelled' })
      .eq('id', planId);

    if (error) throw error;
  }
};
