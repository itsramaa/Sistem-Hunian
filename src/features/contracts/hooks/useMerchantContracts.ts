import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractService } from '../services/contractService';
import { CreateContractPayload } from '../types';

export function useMerchantContracts(merchantId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ['merchant-contracts', merchantId],
    queryFn: () => contractService.getMerchantContracts(merchantId!),
    enabled: !!merchantId,
  });

  const createContractMutation = useMutation({
    mutationFn: async (payload: CreateContractPayload) => {
      const validationError = await contractService.validateContractCreation(
        payload.unit_id,
        payload.tenant_user_id,
        payload.merchant_id
      );
      if (validationError) throw new Error(validationError);
      
      return contractService.createContract(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
    },
  });

  const signContractMutation = useMutation({
    mutationFn: ({ contractId, signatureUrl, userId }: { contractId: string; signatureUrl: string; userId: string }) =>
      contractService.merchantSignContract(contractId, signatureUrl, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
    },
  });

  const updateTermsMutation = useMutation({
    mutationFn: ({ contractId, terms }: { contractId: string; terms: string }) =>
      contractService.updateContractTerms(contractId, terms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ contractId, status }: { contractId: string; status: string }) =>
      contractService.updateContractStatus(contractId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: (contractId: string) => contractService.deleteContract(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
    },
  });

  return {
    contracts,
    isLoading,
    error,
    createContractMutation,
    signContractMutation,
    updateTermsMutation,
    updateStatusMutation,
    deleteContractMutation,
  };
}
