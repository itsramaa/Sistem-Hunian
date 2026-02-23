import { supabase } from '@/lib/integrations/supabase/client';
import type {
  ComplianceDocument,
  DisasterRiskProfile,
  InsuranceClaim,
  InsurancePolicy,
  SecurityIncident,
} from '../types';

// Helper for tables not yet in generated types
const from = (table: string) => supabase.from(table as any);
const cast = <T>(data: unknown): T => data as T;

export const complianceService = {
  async fetchDisasterProfile(propertyId: string): Promise<DisasterRiskProfile | null> {
    const { data, error } = await from('disaster_risk_profiles').select('*').eq('property_id', propertyId).maybeSingle();
    if (error) throw error;
    return cast<DisasterRiskProfile | null>(data);
  },

  async upsertDisasterProfile(payload: Partial<DisasterRiskProfile> & { property_id: string; merchant_id: string }): Promise<DisasterRiskProfile> {
    const { data, error } = await from('disaster_risk_profiles').upsert(payload as any, { onConflict: 'property_id' }).select().single();
    if (error) throw error;
    return cast<DisasterRiskProfile>(data);
  },

  async fetchInsurancePolicies(merchantId: string, propertyId?: string): Promise<InsurancePolicy[]> {
    let q = from('insurance_policies').select('*').eq('merchant_id', merchantId).order('end_date', { ascending: false });
    if (propertyId) q = q.eq('property_id', propertyId);
    const { data, error } = await q;
    if (error) throw error;
    return cast<InsurancePolicy[]>(data) || [];
  },

  async createInsurancePolicy(payload: Omit<InsurancePolicy, 'id' | 'created_at' | 'updated_at'>): Promise<InsurancePolicy> {
    const { data, error } = await from('insurance_policies').insert(payload as any).select().single();
    if (error) throw error;
    return cast<InsurancePolicy>(data);
  },

  async updateInsurancePolicy(id: string, payload: Partial<InsurancePolicy>): Promise<InsurancePolicy> {
    const { data, error } = await from('insurance_policies').update(payload as any).eq('id', id).select().single();
    if (error) throw error;
    return cast<InsurancePolicy>(data);
  },

  async deleteInsurancePolicy(id: string): Promise<void> {
    const { error } = await from('insurance_policies').delete().eq('id', id);
    if (error) throw error;
  },

  async fetchClaims(merchantId: string, policyId?: string): Promise<InsuranceClaim[]> {
    let q = from('insurance_claims').select('*').eq('merchant_id', merchantId).order('claim_date', { ascending: false });
    if (policyId) q = q.eq('policy_id', policyId);
    const { data, error } = await q;
    if (error) throw error;
    return cast<InsuranceClaim[]>(data) || [];
  },

  async createClaim(payload: Omit<InsuranceClaim, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceClaim> {
    const { data, error } = await from('insurance_claims').insert(payload as any).select().single();
    if (error) throw error;
    return cast<InsuranceClaim>(data);
  },

  async fetchComplianceDocs(merchantId: string, propertyId?: string): Promise<ComplianceDocument[]> {
    let q = from('compliance_documents').select('*').eq('merchant_id', merchantId).order('expiry_date', { ascending: true });
    if (propertyId) q = q.eq('property_id', propertyId);
    const { data, error } = await q;
    if (error) throw error;
    return cast<ComplianceDocument[]>(data) || [];
  },

  async createComplianceDoc(payload: Omit<ComplianceDocument, 'id' | 'created_at' | 'updated_at'>): Promise<ComplianceDocument> {
    const { data, error } = await from('compliance_documents').insert(payload as any).select().single();
    if (error) throw error;
    return cast<ComplianceDocument>(data);
  },

  async updateComplianceDoc(id: string, payload: Partial<ComplianceDocument>): Promise<ComplianceDocument> {
    const { data, error } = await from('compliance_documents').update(payload as any).eq('id', id).select().single();
    if (error) throw error;
    return cast<ComplianceDocument>(data);
  },

  async deleteComplianceDoc(id: string): Promise<void> {
    const { error } = await from('compliance_documents').delete().eq('id', id);
    if (error) throw error;
  },

  async fetchSecurityIncidents(merchantId: string, propertyId?: string): Promise<SecurityIncident[]> {
    let q = from('security_incidents').select('*').eq('merchant_id', merchantId).order('incident_date', { ascending: false });
    if (propertyId) q = q.eq('property_id', propertyId);
    const { data, error } = await q;
    if (error) throw error;
    return cast<SecurityIncident[]>(data) || [];
  },

  async createSecurityIncident(payload: Omit<SecurityIncident, 'id' | 'created_at' | 'updated_at'>): Promise<SecurityIncident> {
    const { data, error } = await from('security_incidents').insert(payload as any).select().single();
    if (error) throw error;
    return cast<SecurityIncident>(data);
  },

  async updateSecurityIncident(id: string, payload: Partial<SecurityIncident>): Promise<SecurityIncident> {
    const { data, error } = await from('security_incidents').update(payload as any).eq('id', id).select().single();
    if (error) throw error;
    return cast<SecurityIncident>(data);
  },

  async deleteSecurityIncident(id: string): Promise<void> {
    const { error } = await from('security_incidents').delete().eq('id', id);
    if (error) throw error;
  },

  async fetchPropertyComplianceSummary(propertyId: string, merchantId: string) {
    const [riskProfile, policies, docs, incidents] = await Promise.all([
      this.fetchDisasterProfile(propertyId),
      this.fetchInsurancePolicies(merchantId, propertyId),
      this.fetchComplianceDocs(merchantId, propertyId),
      this.fetchSecurityIncidents(merchantId, propertyId),
    ]);

    const activePolicies = policies.filter(p => p.status === 'active');
    const expiredDocs = docs.filter(d => d.status === 'expired' || (d.expiry_date && new Date(d.expiry_date) < new Date()));
    const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating');

    return {
      riskProfile,
      policies,
      activePolicies: activePolicies.length,
      totalCoverage: activePolicies.reduce((s, p) => s + p.coverage_amount, 0),
      totalPremium: activePolicies.reduce((s, p) => s + p.premium_amount, 0),
      docs,
      expiredDocs: expiredDocs.length,
      totalDocs: docs.length,
      incidents,
      openIncidents: openIncidents.length,
      totalIncidents: incidents.length,
    };
  },
};
