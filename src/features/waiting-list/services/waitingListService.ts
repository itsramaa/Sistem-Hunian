import { supabase } from '@/integrations/supabase/client';
import type { CreateApplicantPayload, WaitingListApplicant } from '../types';
import { isValidTransition, WAITING_LIST_TRANSITIONS } from '@/shared/constants/state-machines';

function mapRow(row: any): WaitingListApplicant {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    applicantName: row.applicant_name,
    applicantPhone: row.applicant_phone,
    applicantEmail: row.applicant_email,
    budgetMin: row.budget_min ? Number(row.budget_min) : null,
    budgetMax: row.budget_max ? Number(row.budget_max) : null,
    preferredMoveIn: row.preferred_move_in,
    specialNeeds: row.special_needs,
    status: row.status,
    qualityScore: row.quality_score ? Number(row.quality_score) : null,
    priorityRank: row.priority_rank,
    notes: row.notes,
    offeredAt: row.offered_at,
    offerExpiresAt: row.offer_expires_at,
    acceptedAt: row.accepted_at,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const waitingListService = {
  async fetchApplicants(merchantId: string, filters?: { status?: string; propertyId?: string }): Promise<WaitingListApplicant[]> {
    let query = supabase
      .from('waiting_list')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.propertyId) query = query.eq('property_id', filters.propertyId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  async addApplicant(payload: CreateApplicantPayload): Promise<WaitingListApplicant> {
    const { data, error } = await supabase
      .from('waiting_list')
      .insert({
        merchant_id: payload.merchantId,
        property_id: payload.propertyId || null,
        applicant_name: payload.applicantName,
        applicant_phone: payload.applicantPhone || null,
        applicant_email: payload.applicantEmail || null,
        budget_min: payload.budgetMin || null,
        budget_max: payload.budgetMax || null,
        preferred_move_in: payload.preferredMoveIn || null,
        special_needs: payload.specialNeeds || null,
        status: 'interested',
      })
      .select()
      .single();

    if (error) throw error;
    return mapRow(data);
  },

  async updateStatus(id: string, currentStatus: string, newStatus: string, extra?: Record<string, any>): Promise<void> {
    if (!isValidTransition(WAITING_LIST_TRANSITIONS, currentStatus, newStatus)) {
      throw new Error(`Transisi tidak valid: ${currentStatus} → ${newStatus}`);
    }

    const updates: Record<string, any> = { status: newStatus, ...extra };
    if (newStatus === 'offered') updates.offered_at = new Date().toISOString();
    if (newStatus === 'accepted') updates.accepted_at = new Date().toISOString();
    if (newStatus === 'rejected') updates.rejected_at = new Date().toISOString();

    const { error } = await supabase.from('waiting_list').update(updates).eq('id', id);
    if (error) throw error;
  },

  async sendOffer(applicantId: string, unitId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: applicant } = await supabase.from('waiting_list').select('status').eq('id', applicantId).single();
    if (!applicant) throw new Error('Applicant not found');

    await this.updateStatus(applicantId, applicant.status, 'offered', {
      unit_id: unitId,
      offer_expires_at: expiresAt.toISOString(),
    });
  },
};
