import { supabase } from '@/lib/integrations/supabase/client';
import { Contract, CreateContractPayload } from '../types';
import { CONTRACT_STATUS_TRANSITIONS, isValidTransition } from '@/shared/constants/state-machines';
import { logStatusChange, createAuditLog } from '@/shared/utils/auditLog';

export const contractService = {
  async getTenantActiveContract(tenantId: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        unit:units (
          unit_number,
          property:properties (
            name,
            address,
            city
          )
        )
      `)
      .eq('tenant_user_id', tenantId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return data as unknown as Contract;
  },

  async getTenantContracts(tenantId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        unit:units (
          unit_number,
          property:properties (
            name,
            address,
            city
          )
        )
      `)
      .eq('tenant_user_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as Contract[];
  },

  async getMerchantContracts(merchantId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        unit:units (
          id,
          unit_number,
          property:properties (
            id,
            name,
            address,
            city
          )
        )
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as Contract[];
  },

  async getContractByUnit(unitId: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        unit:units (
          unit_number,
          property:properties (
            name,
            address,
            city
          )
        )
      `)
      .eq('unit_id', unitId)
      .in('status', ['active', 'notice', 'pending'])
      .maybeSingle();

    if (error) throw error;
    return data as unknown as Contract;
  },

  async validateContractCreation(unitId: string, tenantId: string, merchantId: string): Promise<string | null> {
    // Check for existing active contract on unit
    const { data: existingUnitContract, error: unitCheckError } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('unit_id', unitId)
      .in('status', ['active', 'draft', 'pending_signature', 'notice'])
      .limit(1);

    if (unitCheckError) throw unitCheckError;
    if (existingUnitContract && existingUnitContract.length > 0) {
      return 'This unit already has an active or pending contract';
    }

    // Check for existing active contract for tenant with this merchant
    const { data: existingTenantContract, error: tenantCheckError } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('tenant_user_id', tenantId)
      .eq('merchant_id', merchantId)
      .in('status', ['active', 'draft', 'pending_signature', 'notice'])
      .limit(1);

    if (tenantCheckError) throw tenantCheckError;
    if (existingTenantContract && existingTenantContract.length > 0) {
      return 'This tenant already has an active or pending contract with you';
    }

    return null;
  },

  async createContract(payload: CreateContractPayload): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .insert(payload);
    
    if (error) throw error;

    await createAuditLog({
      action: 'create',
      entityType: 'contract',
      newData: payload as unknown as object,
    });
  },

  async merchantSignContract(contractId: string, signatureUrl: string, userId: string): Promise<void> {
    try {
      // Upload signature
      const base64Data = signatureUrl.split(',')[1];
      if (!base64Data) throw new Error('Invalid signature data');

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const fileName = `signatures/${userId}/${contractId}_merchant_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, blob, { 
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      // Get current contract to check tenant signature
      const { data: contract, error: fetchError } = await supabase
        .from('contracts')
        .select('tenant_signature_url, status')
        .eq('id', contractId)
        .single();

      if (fetchError) throw fetchError;

      const oldStatus = contract?.status || 'draft';
      const newSignatureStatus = contract?.tenant_signature_url ? 'fully_signed' : 'merchant_signed';
      const newContractStatus = contract?.tenant_signature_url ? 'active' : oldStatus;

      // Update contract
      const updateData: Record<string, unknown> = {
        merchant_signature_url: publicUrl,
        merchant_signed_at: new Date().toISOString(),
        signature_status: newSignatureStatus,
      };
      
      if (newContractStatus === 'active') {
        updateData.status = 'active';
      }

      const { error: updateError } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId);

      if (updateError) throw updateError;

      // Audit log for signing
      await createAuditLog({
        action: 'sign',
        entityType: 'contract',
        entityId: contractId,
        oldData: { signature_status: 'pending', status: oldStatus },
        newData: { signature_status: newSignatureStatus, status: newContractStatus },
        userId,
      });
    } catch (error) {
      console.error('Error signing contract:', error);
      throw error;
    }
  },

  async updateContractTerms(contractId: string, terms: string): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .update({ terms })
      .eq('id', contractId);
    
    if (error) throw error;
  },

  async updateContractStatus(contractId: string, newStatus: string): Promise<void> {
    // Fetch current status for validation
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('status')
      .eq('id', contractId)
      .single();

    if (fetchError) throw fetchError;
    const currentStatus = contract?.status || '';

    // Validate transition
    if (!isValidTransition(CONTRACT_STATUS_TRANSITIONS, currentStatus, newStatus)) {
      throw new Error(
        `Invalid contract status transition: "${currentStatus}" → "${newStatus}". ` +
        `Allowed: [${(CONTRACT_STATUS_TRANSITIONS[currentStatus] || []).join(', ')}]`
      );
    }

    const { error } = await supabase
      .from('contracts')
      .update({ status: newStatus })
      .eq('id', contractId);
    
    if (error) throw error;

    // Audit log
    await logStatusChange('contract', contractId, currentStatus, newStatus);
  },

  async deleteContract(contractId: string): Promise<void> {
    // Fetch contract data before deletion for audit
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('status, unit_id, tenant_user_id, merchant_id')
      .eq('id', contractId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId);
    
    if (error) throw error;

    await createAuditLog({
      action: 'delete',
      entityType: 'contract',
      entityId: contractId,
      oldData: contract as unknown as object,
    });
  },

  async uploadContractDocument(contractId: string, file: File): Promise<string> {
    const fileName = `${contractId}/${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('contract-documents')
      .upload(fileName, file, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('contract-documents')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('contracts')
      .update({ contract_document_url: publicUrl })
      .eq('id', contractId);

    if (updateError) throw updateError;
    
    return publicUrl;
  }
};
