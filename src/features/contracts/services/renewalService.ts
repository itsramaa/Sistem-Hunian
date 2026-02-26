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
      // Fallback: query contracts expiring within 90 days
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
    return (data || []).map((r: any) => ({
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
    }));
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

  async signAmendment(amendmentId: string): Promise<void> {
    const { error } = await supabase
      .from('contract_amendments')
      .update({ status: 'signed', signed_at: new Date().toISOString() })
      .eq('id', amendmentId);
    if (error) throw error;
  },
};
