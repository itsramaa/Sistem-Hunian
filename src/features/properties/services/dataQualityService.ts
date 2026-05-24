import { supabase } from '@/lib/integrations/supabase/client';

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
    const { data, error } = await (supabase as any)
      .from('data_quality_checks')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as DataQualityCheck[];
  },

  async fetchLatestCheck(entityId: string): Promise<DataQualityCheck | null> {
    const { data, error } = await (supabase as any)
      .from('data_quality_checks')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as DataQualityCheck | null;
  },

  async overrideValidation(checkId: string, rule: string, reason: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: check, error: fetchErr } = await (supabase as any)
      .from('data_quality_checks')
      .select('overrides')
      .eq('id', checkId)
      .single();
    if (fetchErr) throw fetchErr;

    const overrides = (check?.overrides as any[]) || [];
    overrides.push({ rule, reason, overridden_by: user.id, overridden_at: new Date().toISOString() });

    const { error } = await (supabase as any)
      .from('data_quality_checks')
      .update({ overrides })
      .eq('id', checkId);
    if (error) throw error;
  },

  async markFinalValidated(checkId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await (supabase as any)
      .from('data_quality_checks')
      .update({
        is_final_validated: true,
        validated_by: user.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', checkId);
    if (error) throw error;
  },

  async fetchDataVersions(entityType: string, entityId: string): Promise<DataVersion[]> {
    const { data, error } = await (supabase as any)
      .from('property_data_versions')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('version_number', { ascending: false });
    if (error) throw error;
    return (data || []) as DataVersion[];
  },

  async createVersion(
    entityType: string,
    entityId: string,
    snapshotData: Record<string, unknown>,
    changeSummary: string,
    changeReason?: string,
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    // Get next version number
    const { data: latest } = await (supabase as any)
      .from('property_data_versions')
      .select('version_number')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latest?.version_number || 0) + 1;

    const { error } = await (supabase as any).from('property_data_versions').insert({
      entity_type: entityType,
      entity_id: entityId,
      version_number: nextVersion,
      snapshot_data: snapshotData,
      change_summary: changeSummary,
      changed_by: user?.id || null,
      change_reason: changeReason || null,
    });
    if (error) throw error;
  },

  async restoreVersion(versionId: string): Promise<void> {
    const { data: version, error: vErr } = await (supabase as any)
      .from('property_data_versions')
      .select('*')
      .eq('id', versionId)
      .single();
    if (vErr || !version) throw new Error('Versi tidak ditemukan');

    const v = version as DataVersion;
    const snapshot = v.snapshot_data;
    const { id, created_at, updated_at, merchant_id, ...updateData } = snapshot as any;

    if (v.entity_type === 'property') {
      const { error } = await supabase.from('properties').update(updateData).eq('id', v.entity_id);
      if (error) throw error;
    } else if (v.entity_type === 'unit') {
      const { error } = await supabase.from('units').update(updateData).eq('id', v.entity_id);
      if (error) throw error;
    }

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert([{
      user_id: user?.id,
      action: 'restore',
      entity_type: v.entity_type,
      entity_id: v.entity_id,
      old_data: null,
      new_data: snapshot as any,
      metadata: { restored_from_version: v.version_number, version_id: versionId } as any,
    }]);
  },
};
