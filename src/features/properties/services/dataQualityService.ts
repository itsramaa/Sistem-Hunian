import { apiClient } from '@/lib/axios';

export interface ValidationResult {
  entity_type: string;
  entity_id: string;
  rule: string;
  status: 'pass' | 'warning' | 'error';
  message: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface QualityCheckResult {
  success: boolean;
  property_score: number;
  unit_scores: { unit_id: string; score: number }[];
  aggregate_score: number;
  validations: ValidationResult[];
  outliers: { entity_id: string; field: string; value: number; expected_range: string; anomaly_type: string }[];
  summary: string;
  error?: string;
}

export interface DataQualityCheck {
  id: string;
  merchant_id: string;
  entity_type: string;
  entity_id: string;
  quality_score: number;
  validation_results: ValidationResult[];
  overrides: { rule: string; reason: string; overridden_by: string; overridden_at: string }[];
  is_final_validated: boolean;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
}

export interface DataVersion {
  id: string;
  entity_type: string;
  entity_id: string;
  version_number: number;
  snapshot_data: Record<string, unknown>;
  change_summary: string | null;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
}

export const dataQualityService = {
  async invokeDataQualityCheck(_propertyId: string): Promise<QualityCheckResult> {
    // DSS/ML data quality check was removed in PR #1.
    throw new Error('ML data quality check feature is not available.');
  },

  async fetchQualityChecks(merchantId: string): Promise<DataQualityCheck[]> {
    const response = await apiClient.get('/data-quality-checks', { params: { merchant_id: merchantId } });
    return (response.data.data || []) as DataQualityCheck[];
  },

  async fetchLatestCheck(entityId: string): Promise<DataQualityCheck | null> {
    const response = await apiClient.get('/data-quality-checks/latest', { params: { entity_id: entityId } });
    return response.data.data as DataQualityCheck | null;
  },

  async overrideValidation(checkId: string, rule: string, reason: string): Promise<void> {
    await apiClient.post(`/data-quality-checks/${checkId}/override`, { rule, reason });
  },

  async markFinalValidated(checkId: string): Promise<void> {
    await apiClient.post(`/data-quality-checks/${checkId}/validate`);
  },

  async fetchDataVersions(entityType: string, entityId: string): Promise<DataVersion[]> {
    const response = await apiClient.get('/property-data-versions', {
      params: { entity_type: entityType, entity_id: entityId },
    });
    return (response.data.data || []) as DataVersion[];
  },

  async createVersion(
    entityType: string,
    entityId: string,
    snapshotData: Record<string, unknown>,
    changeSummary: string,
    changeReason?: string,
  ): Promise<void> {
    await apiClient.post('/property-data-versions', {
      entity_type: entityType,
      entity_id: entityId,
      snapshot_data: snapshotData,
      change_summary: changeSummary,
      change_reason: changeReason || null,
    });
  },

  async restoreVersion(versionId: string): Promise<void> {
    await apiClient.post(`/property-data-versions/${versionId}/restore`);
  },
};
