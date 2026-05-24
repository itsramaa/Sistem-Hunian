import type {
  ComplianceDocument,
  DisasterRiskProfile,
  InsuranceClaim,
  InsurancePolicy,
  SecurityIncident,
} from '../types';

export const complianceService = {
  async fetchDisasterProfile(_propertyId: string): Promise<DisasterRiskProfile | null> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('disaster_risk_profiles').select(*)
    return null;
  },

  async upsertDisasterProfile(_payload: Partial<DisasterRiskProfile> & { property_id: string; merchant_id: string }): Promise<DisasterRiskProfile> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('disaster_risk_profiles').upsert(...)
    return _payload as DisasterRiskProfile;
  },

  async fetchInsurancePolicies(_merchantId: string, _propertyId?: string): Promise<InsurancePolicy[]> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('insurance_policies').select(*)
    return [];
  },

  async createInsurancePolicy(_payload: Omit<InsurancePolicy, 'id' | 'created_at' | 'updated_at'>): Promise<InsurancePolicy> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('insurance_policies').insert(...)
    return _payload as InsurancePolicy;
  },

  async updateInsurancePolicy(_id: string, _payload: Partial<InsurancePolicy>): Promise<InsurancePolicy> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('insurance_policies').update(...)
    return _payload as InsurancePolicy;
  },

  async deleteInsurancePolicy(_id: string): Promise<void> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('insurance_policies').delete(...)
  },

  async fetchClaims(_merchantId: string, _policyId?: string): Promise<InsuranceClaim[]> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('insurance_claims').select(*)
    return [];
  },

  async createClaim(_payload: Omit<InsuranceClaim, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceClaim> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('insurance_claims').insert(...)
    return _payload as InsuranceClaim;
  },

  async fetchComplianceDocs(_merchantId: string, _propertyId?: string): Promise<ComplianceDocument[]> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('compliance_documents').select(*)
    return [];
  },

  async createComplianceDoc(_payload: Omit<ComplianceDocument, 'id' | 'created_at' | 'updated_at'>): Promise<ComplianceDocument> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('compliance_documents').insert(...)
    return _payload as ComplianceDocument;
  },

  async updateComplianceDoc(_id: string, _payload: Partial<ComplianceDocument>): Promise<ComplianceDocument> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('compliance_documents').update(...)
    return _payload as ComplianceDocument;
  },

  async deleteComplianceDoc(_id: string): Promise<void> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('compliance_documents').delete(...)
  },

  async fetchSecurityIncidents(_merchantId: string, _propertyId?: string): Promise<SecurityIncident[]> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('security_incidents').select(*)
    return [];
  },

  async createSecurityIncident(_payload: Omit<SecurityIncident, 'id' | 'created_at' | 'updated_at'>): Promise<SecurityIncident> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('security_incidents').insert(...)
    return _payload as SecurityIncident;
  },

  async updateSecurityIncident(_id: string, _payload: Partial<SecurityIncident>): Promise<SecurityIncident> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('security_incidents').update(...)
    return _payload as SecurityIncident;
  },

  async deleteSecurityIncident(_id: string): Promise<void> {
    // TODO: Go endpoint not yet implemented — was: supabase.from('security_incidents').delete(...)
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
