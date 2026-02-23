export interface DisasterRiskProfile {
  id: string;
  property_id: string;
  merchant_id: string;
  risk_zone: string;
  flood_risk: string;
  earthquake_risk: string;
  landslide_risk: string;
  fire_risk: string;
  disaster_history: DisasterEvent[];
  mitigation_systems: MitigationSystem[];
  last_assessed_at: string | null;
  overall_risk_score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisasterEvent {
  date: string;
  type: string;
  description: string;
  damage_cost: number;
}

export interface MitigationSystem {
  type: string;
  status: string;
  last_checked: string;
}

export interface InsurancePolicy {
  id: string;
  property_id: string;
  merchant_id: string;
  policy_number: string;
  provider: string;
  policy_type: string;
  coverage_amount: number;
  premium_amount: number;
  premium_frequency: string;
  start_date: string;
  end_date: string;
  status: string;
  coverage_details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InsuranceClaim {
  id: string;
  policy_id: string;
  merchant_id: string;
  claim_date: string;
  incident_date: string;
  incident_type: string;
  description: string | null;
  claim_amount: number;
  approved_amount: number | null;
  status: string;
  documents: Record<string, unknown>[];
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDocument {
  id: string;
  property_id: string;
  merchant_id: string;
  document_type: string;
  document_name: string;
  document_url: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityIncident {
  id: string;
  property_id: string;
  merchant_id: string;
  incident_date: string;
  incident_type: string;
  severity: string;
  description: string | null;
  location_detail: string | null;
  reported_by: string | null;
  police_report_number: string | null;
  damage_cost: number;
  resolution: string | null;
  resolved_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const DISASTER_TYPES = ['flood', 'earthquake', 'landslide', 'fire', 'storm', 'other'] as const;
export const INCIDENT_TYPES = ['theft', 'vandalism', 'fire', 'flood', 'intrusion', 'other'] as const;
export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const POLICY_TYPES = ['property', 'fire', 'flood', 'earthquake', 'comprehensive'] as const;
export const DOC_TYPES = ['imb', 'pbb', 'insurance_policy', 'fire_cert', 'building_cert', 'other'] as const;

export const DOC_TYPE_LABELS: Record<string, string> = {
  imb: 'IMB / PBG',
  pbb: 'PBB (Pajak Bumi & Bangunan)',
  insurance_policy: 'Polis Asuransi',
  fire_cert: 'Sertifikat Kebakaran',
  building_cert: 'Sertifikat Laik Fungsi',
  other: 'Lainnya',
};

export const RISK_LABEL: Record<string, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  critical: 'Kritis',
};
