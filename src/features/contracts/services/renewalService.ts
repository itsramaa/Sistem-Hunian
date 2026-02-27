import { supabase } from '@/integrations/supabase/client';

export interface RenewalAlert {
  id: string;
  contractId: string;
  merchantId: string;
  alertType: string;
  alertDate: string;
  status: string;
  tenantName: string | null;
  unitNumber: string | null;
  endDate: string;
  rentAmount: number;
}

export interface ContractAmendment {
  id: string;
  contractId: string;
  amendmentType: string;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  status: string;
  effectiveDate: string | null;
  notes: string | null;
  signedAt: string | null;
  createdAt: string;
  negotiationStatus: string | null;
  merchantOffer: Record<string, any> | null;
  tenantCounterOffer: Record<string, any> | null;
  merchantSignature: string | null;
  tenantSignature: string | null;
  tenantSignedAt: string | null;
}

function mapAmendment(r: any): ContractAmendment {
  return {
    id: r.id,
    contractId: r.contract_id,
    amendmentType: r.amendment_type,
    oldValues: r.old_values || {},
    newValues: r.new_values || {},
    status: r.status,
    effectiveDate: r.effective_date,
    notes: r.notes,
    signedAt: r.signed_at,
    createdAt: r.created_at,
    negotiationStatus: r.negotiation_status || null,
    merchantOffer: r.merchant_offer || null,
    tenantCounterOffer: r.tenant_counter_offer || null,
    merchantSignature: r.merchant_signature || null,
    tenantSignature: r.tenant_signature || null,
    tenantSignedAt: r.tenant_signed_at || null,
  };
}

export const renewalService = {
  async fetchAlerts(merchantId: string): Promise<RenewalAlert[]> {
    const { data, error } = await supabase
      .from('lease_renewal_alerts')
      .select('*, contracts(end_date, rent_amount, tenant_user_id, unit_id, units(unit_number), profiles:tenant_user_id(full_name))')
      .eq('merchant_id', merchantId)
      .order('alert_date', { ascending: false })
      .limit(50);

    if (error) {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 90);

      const { data: contracts, error: cErr } = await supabase
        .from('contracts')
        .select('id, end_date, rent_amount, tenant_user_id, status, unit_id, units(unit_number)')
        .eq('merchant_id', merchantId)
        .eq('status', 'active')
        .gte('end_date', now.toISOString().split('T')[0])
        .lte('end_date', future.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (cErr) throw cErr;

      return (contracts || []).map((c: any) => ({
        id: c.id,
        contractId: c.id,
        merchantId,
        alertType: 'expiring_soon',
        alertDate: new Date().toISOString(),
        status: 'pending',
        tenantName: null,
        unitNumber: c.units?.unit_number || '-',
        endDate: c.end_date,
        rentAmount: Number(c.rent_amount),
      }));
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      contractId: r.contract_id,
      merchantId: r.merchant_id,
      alertType: r.alert_type,
      alertDate: r.alert_date,
      status: r.status,
      tenantName: r.contracts?.profiles?.full_name || null,
      unitNumber: r.contracts?.units?.unit_number || '-',
      endDate: r.contracts?.end_date || '',
      rentAmount: Number(r.contracts?.rent_amount || 0),
    }));
  },

  async fetchAmendments(contractId: string): Promise<ContractAmendment[]> {
    const { data, error } = await supabase
      .from('contract_amendments')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAmendment);
  },

  async fetchAmendmentsByMerchant(merchantId: string): Promise<ContractAmendment[]> {
    const { data, error } = await supabase
      .from('contract_amendments')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map(mapAmendment);
  },

  async createAmendment(payload: {
    contractId: string;
    merchantId: string;
    amendmentType: string;
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    effectiveDate?: string;
    notes?: string;
  }): Promise<void> {
    const { error } = await supabase.from('contract_amendments').insert({
      contract_id: payload.contractId,
      merchant_id: payload.merchantId,
      amendment_type: payload.amendmentType,
      old_values: payload.oldValues,
      new_values: payload.newValues,
      effective_date: payload.effectiveDate || null,
      notes: payload.notes || null,
      status: 'draft',
    });
    if (error) throw error;
  },

  async sendOffer(payload: {
    contractId: string;
    merchantId: string;
    tenantUserId: string;
    offer: { newRent: number; newDuration: number; terms?: string };
    effectiveDate: string;
    currentRent: number;
  }): Promise<void> {
    const { error } = await supabase.from('contract_amendments').insert({
      contract_id: payload.contractId,
      merchant_id: payload.merchantId,
      tenant_user_id: payload.tenantUserId,
      amendment_type: 'renewal',
      old_values: { rent_amount: payload.currentRent },
      new_values: { rent_amount: payload.offer.newRent, duration_months: payload.offer.newDuration },
      merchant_offer: payload.offer as any,
      effective_date: payload.effectiveDate,
      notes: payload.offer.terms || null,
      status: 'sent',
      negotiation_status: 'merchant_proposed',
    });
    if (error) throw error;
  },

  async submitCounterOffer(amendmentId: string, counterOffer: { newRent: number; notes: string }): Promise<void> {
    const { error } = await supabase
      .from('contract_amendments')
      .update({
        tenant_counter_offer: counterOffer as any,
        negotiation_status: 'tenant_countered',
        status: 'sent',
      })
      .eq('id', amendmentId);
    if (error) throw error;
  },

  async acceptOffer(amendmentId: string): Promise<void> {
    const { error } = await supabase
      .from('contract_amendments')
      .update({ negotiation_status: 'agreed', status: 'sent' })
      .eq('id', amendmentId);
    if (error) throw error;
  },

  async rejectOffer(amendmentId: string): Promise<void> {
    const { error } = await supabase
      .from('contract_amendments')
      .update({ negotiation_status: 'rejected', status: 'rejected' })
      .eq('id', amendmentId);
    if (error) throw error;
  },

  async signAsMerchant(amendmentId: string, signatureData: string): Promise<void> {
    const { error } = await supabase
      .from('contract_amendments')
      .update({
        merchant_signature: signatureData,
        status: 'sent',
        signed_at: new Date().toISOString(),
      })
      .eq('id', amendmentId);
    if (error) throw error;
  },

  async signAsTenant(amendmentId: string, signatureData: string): Promise<void> {
    // Get amendment details to apply to contract
    const { data: amendment, error: fetchErr } = await supabase
      .from('contract_amendments')
      .select('*')
      .eq('id', amendmentId)
      .single();
    if (fetchErr) throw fetchErr;

    // Update amendment
    const { error } = await supabase
      .from('contract_amendments')
      .update({
        tenant_signature: signatureData,
        tenant_signed_at: new Date().toISOString(),
        signed_at: new Date().toISOString(),
        status: 'signed',
      })
      .eq('id', amendmentId);
    if (error) throw error;

    // Apply new values to contract
    const newValues = amendment.new_values as any;
    if (newValues) {
      const updates: Record<string, any> = {};
      if (newValues.rent_amount) updates.rent_amount = newValues.rent_amount;
      if (newValues.duration_months && amendment.effective_date) {
        const endDate = new Date(amendment.effective_date);
        endDate.setMonth(endDate.getMonth() + newValues.duration_months);
        updates.end_date = endDate.toISOString().split('T')[0];
        updates.start_date = amendment.effective_date;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('contracts').update(updates).eq('id', amendment.contract_id);
      }
    }
  },

  async signAmendment(amendmentId: string): Promise<void> {
    const { error } = await supabase
      .from('contract_amendments')
      .update({ status: 'signed', signed_at: new Date().toISOString() })
      .eq('id', amendmentId);
    if (error) throw error;
  },
};
