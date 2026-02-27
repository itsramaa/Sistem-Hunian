import { supabase } from '@/lib/integrations/supabase/client';
import { invokeTenantQualityScoring } from '@/features/dss/services/tenantQualityService';
import { TenantScreening, ScreeningFormData, mapQualityGradeToScreeningGrade } from '../types';

export const screeningService = {
  async fetchScreenings(merchantId: string): Promise<TenantScreening[]> {
    const { data, error } = await (supabase as any)
      .from('tenant_screenings')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as TenantScreening[];
  },

  async createScreening(merchantId: string, formData: ScreeningFormData): Promise<TenantScreening> {
    const { data, error } = await (supabase as any)
      .from('tenant_screenings')
      .insert({
        merchant_id: merchantId,
        tenant_user_id: formData.tenant_user_id || null,
        candidate_name: formData.candidate_name,
        candidate_email: formData.candidate_email || null,
        candidate_phone: formData.candidate_phone || null,
        occupation: formData.occupation || null,
        employer_name: formData.employer_name || null,
        monthly_income: formData.monthly_income || null,
        previous_landlord_name: formData.previous_landlord_name || null,
        previous_landlord_phone: formData.previous_landlord_phone || null,
        previous_rental_notes: formData.previous_rental_notes || null,
        guarantor_name: formData.guarantor_name || null,
        guarantor_phone: formData.guarantor_phone || null,
        guarantor_relation: formData.guarantor_relation || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as TenantScreening;
  },

  async runAiScoring(screening: TenantScreening): Promise<TenantScreening> {
    const result = await invokeTenantQualityScoring({
      screening_data: {
        name: screening.candidate_name,
        occupation: screening.occupation || '',
        monthly_income: screening.monthly_income || 0,
        previous_rental_history: screening.previous_rental_notes || undefined,
        references: screening.previous_landlord_name || undefined,
      },
    });

    if (!('scoring' in result)) throw new Error('Unexpected batch result');

    const scoring = result.scoring;
    const grade = mapQualityGradeToScreeningGrade(scoring.quality_grade);

    const { data, error } = await (supabase as any)
      .from('tenant_screenings')
      .update({
        screening_score: scoring.quality_score,
        screening_grade: grade,
        ai_assessment: scoring as unknown as Record<string, unknown>,
        status: 'scored',
      })
      .eq('id', screening.id)
      .select()
      .single();
    if (error) throw error;
    return data as TenantScreening;
  },

  async approveScreening(id: string, userId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('tenant_screenings')
      .update({ status: 'approved', reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async rejectScreening(id: string, userId: string, notes?: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('tenant_screenings')
      .update({ status: 'rejected', reviewed_by: userId, reviewed_at: new Date().toISOString(), notes: notes || null })
      .eq('id', id);
    if (error) throw error;
  },

  async getApprovedScreeningForTenant(merchantId: string, tenantUserId: string): Promise<TenantScreening | null> {
    const { data, error } = await (supabase as any)
      .from('tenant_screenings')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('tenant_user_id', tenantUserId)
      .in('status', ['approved', 'scored'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as TenantScreening | null;
  },
};
