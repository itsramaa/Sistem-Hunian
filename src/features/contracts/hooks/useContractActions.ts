import { useAuth } from '@/features/auth/hooks/useAuth';
import { useState } from 'react';
import { toast } from 'sonner';
import { Contract } from '../types';
import { ContractFormData } from '../types/schema';
import { useMerchantContracts } from './useMerchantContracts';

export function useContractActions() {
  const { merchant, user } = useAuth();
  const { 
    contracts,
    isLoading,
    createContractMutation,
    signContractMutation,
    updateTermsMutation,
    updateStatusMutation,
    deleteContractMutation,
  } = useMerchantContracts(merchant?.id);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editTermsDialogOpen, setEditTermsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [editingTerms, setEditingTerms] = useState('');

  const handleCreateContract = (data: ContractFormData, resetForm: () => void) => {
    if (!merchant) return;
    
    createContractMutation.mutate({
      ...data,
      merchant_id: merchant.id,
      status: 'draft',
    }, {
      onSuccess: () => {
        toast.success('Contract created successfully');
        setCreateDialogOpen(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create contract');
      }
    });
  };

  const handleDeleteContract = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!contractToDelete) return;
    
    deleteContractMutation.mutate(contractToDelete.id, {
      onSuccess: () => {
        toast.success('Contract deleted successfully');
        setDeleteDialogOpen(false);
        setContractToDelete(null);
      },
      onError: (error) => {
        toast.error(`Failed to delete contract: ${error.message}`);
      }
    });
  };

  const handleMarkNotice = (contract: Contract) => {
    updateStatusMutation.mutate({
      contractId: contract.id,
      status: 'notice',
    }, {
      onSuccess: () => {
        toast.success('Contract marked as notice period');
      },
      onError: (error) => {
        toast.error(`Failed to update status: ${error.message}`);
      }
    });
  };

  const handleSignContract = () => {
    if (!signatureDataUrl || !selectedContract || !user?.id) {
      toast.error('Please draw your signature first');
      return;
    }
    signContractMutation.mutate({
      contractId: selectedContract.id,
      signatureUrl: signatureDataUrl,
      userId: user.id
    }, {
      onSuccess: () => {
        setSignDialogOpen(false);
        setSelectedContract(null);
        setSignatureDataUrl(null);
        toast.success('Contract signed successfully!');
      },
      onError: (error) => {
        toast.error(`Failed to sign contract: ${error.message}`);
      }
    });
  };

  const openSignDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setSignDialogOpen(true);
  };

  const openViewDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setViewDialogOpen(true);
  };

  const openEditTermsDialog = (contract: Contract) => {
    if (contract.tenant_signature_url) {
      toast.error('Terms cannot be edited after tenant has signed');
      return;
    }
    setSelectedContract(contract);
    setEditingTerms(contract.terms || '');
    setEditTermsDialogOpen(true);
  };

  const handleSaveTerms = () => {
    if (!selectedContract) return;
    if (editingTerms.length > 10000) {
      toast.error('Terms cannot exceed 10,000 characters');
      return;
    }
    updateTermsMutation.mutate({
      contractId: selectedContract.id,
      terms: editingTerms,
    }, {
      onSuccess: () => {
        setEditTermsDialogOpen(false);
        setSelectedContract(null);
        toast.success('Contract terms updated successfully');
      },
      onError: (error) => {
        toast.error(`Failed to update terms: ${error.message}`);
      }
    });
  };

  const handleSaveSignature = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    toast.success('Signature captured');
  };

  return {
    contracts,
    isLoading,
    // State
    createDialogOpen, setCreateDialogOpen,
    signDialogOpen, setSignDialogOpen,
    viewDialogOpen, setViewDialogOpen,
    editTermsDialogOpen, setEditTermsDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen,
    selectedContract, setSelectedContract,
    contractToDelete,
    signatureDataUrl, setSignatureDataUrl,
    editingTerms, setEditingTerms,
    
    // Actions
    handleCreateContract,
    handleDeleteContract,
    confirmDelete,
    handleMarkNotice,
    handleSaveSignature,
    handleSignContract,
    openSignDialog,
    openViewDialog,
    openEditTermsDialog,
    handleSaveTerms,
    
    // Mutations (exposed for loading states)
    createContractMutation,
    signContractMutation,
    updateTermsMutation,
    updateStatusMutation,
    deleteContractMutation,
  };
}
