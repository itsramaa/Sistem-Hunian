import { apiClient } from '@/lib/axios';
import { Contract, CreateContractPayload } from '../types';
import { CONTRACT_STATUS_TRANSITIONS, isValidTransition } from '@/shared/constants/state-machines';
import { logStatusChange } from '@/shared/utils/auditLog';

export const contractService = {
  async getTenantActiveContract(tenantId: string): Promise<Contract | null> {
    try {
      const response = await apiClient.get('/contracts', {
        params: { tenant_user_id: tenantId, status: 'active' },
      });
      const items: Contract[] = response.data.data;
      return items?.[0] ?? null;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch active contract');
    }
  },

  async getTenantContracts(tenantId: string): Promise<Contract[]> {
    try {
      const response = await apiClient.get('/contracts', {
        params: { tenant_user_id: tenantId },
      });
      return response.data.data as Contract[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch tenant contracts');
    }
  },

  async getMerchantContracts(merchantId: string): Promise<Contract[]> {
    try {
      const response = await apiClient.get('/contracts', {
        params: { merchant_id: merchantId },
      });
      return response.data.data as Contract[];
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch merchant contracts');
    }
  },

  async getContractByUnit(unitId: string): Promise<Contract | null> {
    try {
      const response = await apiClient.get('/contracts', {
        params: { unit_id: unitId },
      });
      const items: Contract[] = response.data.data;
      return items?.[0] ?? null;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch contract by unit');
    }
  },

  async validateContractCreation(unitId: string, tenantId: string, merchantId: string): Promise<string | null> {
    try {
      const response = await apiClient.get('/contracts/validate', {
        params: { unit_id: unitId, tenant_user_id: tenantId, merchant_id: merchantId },
      });
      return response.data.data?.message ?? null;
    } catch (error: any) {
      // 409 Conflict means validation failed with a message
      if (error.response?.status === 409) {
        return error.response.data?.error?.message || 'Contract validation failed';
      }
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to validate contract creation');
    }
  },

  async createContract(payload: CreateContractPayload): Promise<void> {
    try {
      await apiClient.post('/contracts', payload);
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to create contract');
    }
  },

  async merchantSignContract(contractId: string, signatureUrl: string, userId: string): Promise<void> {
    try {
      // Upload signature — keep Supabase Storage as-is
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

      // TODO: implement file storage endpoint — was: supabase.storage.from('verification-documents').upload()
      const publicUrl = `/storage/verification-documents/${fileName}`;

      // Persist signature via API
      await apiClient.post(`/contracts/${contractId}/sign`, {
        role: 'merchant',
        signature_url: publicUrl,
        user_id: userId,
      });
    } catch (error: any) {
      console.error('Error signing contract:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to sign contract');
    }
  },

  async updateContractTerms(contractId: string, terms: string): Promise<void> {
    try {
      await apiClient.put(`/contracts/${contractId}`, { terms });
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to update contract terms');
    }
  },

  async updateContractStatus(contractId: string, newStatus: string): Promise<void> {
    try {
      // Fetch current status for local validation
      const contractResponse = await apiClient.get(`/contracts/${contractId}`);
      const currentStatus: string = contractResponse.data.data?.status || '';

      if (!isValidTransition(CONTRACT_STATUS_TRANSITIONS, currentStatus, newStatus)) {
        throw new Error(
          `Invalid contract status transition: "${currentStatus}" → "${newStatus}". ` +
          `Allowed: [${(CONTRACT_STATUS_TRANSITIONS[currentStatus] || []).join(', ')}]`
        );
      }

      await apiClient.put(`/contracts/${contractId}/status`, { status: newStatus });

      await logStatusChange('contract', contractId, currentStatus, newStatus);
    } catch (error: any) {
      if (error.message?.startsWith('Invalid contract status transition')) throw error;
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to update contract status');
    }
  },

  async deleteContract(contractId: string): Promise<void> {
    try {
      await apiClient.delete(`/contracts/${contractId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to delete contract');
    }
  },

  async uploadContractDocument(contractId: string, file: File): Promise<string> {
    const fileName = `${contractId}/${Date.now()}_${file.name}`;

    // TODO: implement file storage endpoint — was: supabase.storage.from('contract-documents').upload()
    const publicUrl = `/storage/contract-documents/${fileName}`;

    try {
      await apiClient.put(`/contracts/${contractId}`, { contract_document_url: publicUrl });
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to update contract document URL');
    }

    return publicUrl;
  },

  async processDepositRefund(contractId: string, refundData: { amount: number; reason: string }) {
    try {
      const response = await apiClient.post(`/contracts/${contractId}/deposit-refund`, refundData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to process deposit refund');
    }
  },
};
