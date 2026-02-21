import { useAuth } from '@/features/auth/hooks/useAuth';
import { ContractDetailsDialog } from '@/features/contracts/components/ContractDetailsDialog';
import { ContractsFilters } from '@/features/contracts/components/ContractsFilters';
import { ContractsTable } from '@/features/contracts/components/ContractsTable';
import { ContractStats } from '@/features/contracts/components/ContractStats';
import { CreateContractDialog } from '@/features/contracts/components/CreateContractDialog';
import { DeleteContractDialog } from '@/features/contracts/components/DeleteContractDialog';
import { EditTermsDialog } from '@/features/contracts/components/EditTermsDialog';
import { SignContractDialog } from '@/features/contracts/components/SignContractDialog';
import { useContractActions } from '@/features/contracts/hooks/useContractActions';
import { Contract } from '@/features/contracts/types';
import { usePropertiesWithUnits } from '@/features/properties/hooks/useMerchantProperties';
import { useMerchantTenants, useTenantProfiles } from '@/features/users/hooks/useMerchantTenants';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function MerchantContracts() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('active');
  
  // Pagination state per tab
  const [draftPage, setDraftPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  
  const {
    contracts,
    isLoading,
    createDialogOpen: showCreateDialog,
    setCreateDialogOpen: setShowCreateDialog,
    signDialogOpen, setSignDialogOpen,
    viewDialogOpen, setViewDialogOpen,
    editTermsDialogOpen, setEditTermsDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen,
    selectedContract, setSelectedContract,
    contractToDelete, setContractToDelete,
    signatureDataUrl, setSignatureDataUrl,
    editingTerms, setEditingTerms,
    
    handleCreateContract: createContractAction,
    handleDeleteContract,
    confirmDelete: handleConfirmDelete,
    handleMarkNotice,
    handleSaveSignature,
    handleSignContract,
    openSignDialog,
    openViewDialog,
    openEditTermsDialog: handleEditTerms,
    handleSaveTerms,
    createContractMutation,
    signContractMutation,
    updateTermsMutation,
    deleteContractMutation,
    canDeleteContract
  } = useContractActions(merchant?.id);

  // Reset page when filters or tab change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, activeTab]);

  const { tenants: merchantTenants } = useMerchantTenants(merchant?.id);
  const { properties } = usePropertiesWithUnits(merchant?.id);
  const { profileMap } = useTenantProfiles(contracts || []);

  const availableUnits = properties?.flatMap(p => 
    p.units?.filter(u => u.status === 'vacant').map(u => ({
      ...u,
      property_name: p.name
    }))
  ) || [];

  const filteredContracts = useMemo(() => {
    return (contracts || []).filter(contract => {
      const tenantName = profileMap.get(contract.tenant_user_id)?.full_name || '';
      const matchesSearch = 
        contract.contract_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tenantName.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [contracts, debouncedSearch, statusFilter, profileMap]);

  const activeContracts = useMemo(() => filteredContracts.filter(c => 
    c.status === 'active' || c.status === 'notice_given'
  ), [filteredContracts]);

  const draftContracts = useMemo(() => filteredContracts.filter(c => 
    c.status === 'draft'
  ), [filteredContracts]);

  const pendingSignature = useMemo(() => filteredContracts.filter(c => 
    (c.status === 'pending' || c.status === 'active') && 
    (c.tenant_signature_url && !c.merchant_signature_url)
  ), [filteredContracts]);

  const pastContracts = useMemo(() => filteredContracts.filter(c => 
    c.status === 'terminated' || c.status === 'expired' || c.status === 'completed'
  ), [filteredContracts]);

  const getPaginatedData = (data: Contract[], currentPage: number) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };

  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold">Contracts</h1>
            <p className="text-muted-foreground">Manage rental agreements with your tenants</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Contract
          </Button>
        </div>

        <ContractStats
          totalContracts={contracts?.length || 0}
          activeCount={activeContracts.length}
          pendingSignatureCount={pendingSignature.length}
          pastCount={pastContracts.length}
          loading={isLoading}
        />

        {/* Search & Filter */}
        <ContractsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="draft">Draft ({draftContracts.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeContracts.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Awaiting Signature ({pendingSignature.length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({pastContracts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="draft" className="mt-4">
            <ContractsTable
              contracts={getPaginatedData(draftContracts, draftPage)}
              isLoading={isLoading}
              tenantProfiles={profileMap}
              onView={openViewDialog}
              onSign={openSignDialog}
              onDelete={handleDeleteContract}
              canDelete={canDeleteContract}
              page={draftPage}
              totalPages={Math.ceil(draftContracts.length / ITEMS_PER_PAGE)}
              totalContracts={draftContracts.length}
              onPageChange={setDraftPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <ContractsTable
              contracts={getPaginatedData(activeContracts, activePage)}
              isLoading={isLoading}
              tenantProfiles={profileMap}
              onView={openViewDialog}
              onSign={openSignDialog}
              onDelete={handleDeleteContract}
              onMarkNotice={handleMarkNotice}
              canDelete={canDeleteContract}
              page={activePage}
              totalPages={Math.ceil(activeContracts.length / ITEMS_PER_PAGE)}
              totalContracts={activeContracts.length}
              onPageChange={setActivePage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <ContractsTable
              contracts={getPaginatedData(pendingSignature, pendingPage)}
              isLoading={isLoading}
              tenantProfiles={profileMap}
              onView={openViewDialog}
              onSign={openSignDialog}
              onDelete={handleDeleteContract}
              canDelete={canDeleteContract}
              page={pendingPage}
              totalPages={Math.ceil(pendingSignature.length / ITEMS_PER_PAGE)}
              totalContracts={pendingSignature.length}
              onPageChange={setPendingPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            <ContractsTable
              contracts={getPaginatedData(pastContracts, pastPage)}
              isLoading={isLoading}
              tenantProfiles={profileMap}
              onView={openViewDialog}
              onSign={openSignDialog}
              onDelete={handleDeleteContract}
              canDelete={canDeleteContract}
              page={pastPage}
              totalPages={Math.ceil(pastContracts.length / ITEMS_PER_PAGE)}
              totalContracts={pastContracts.length}
              onPageChange={setPastPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateContractDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          units={availableUnits}
          tenants={merchantTenants}
          onSubmit={createContractAction}
          isLoading={createContractMutation.isPending}
        />

        <SignContractDialog
          open={signDialogOpen}
          onOpenChange={setSignDialogOpen}
          onSaveSignature={handleSaveSignature}
          onSign={handleSignContract}
          signatureDataUrl={signatureDataUrl}
          isSigning={signContractMutation.isPending}
        />

        <ContractDetailsDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          contract={selectedContract}
          tenantName={selectedContract ? profileMap.get(selectedContract.tenant_user_id)?.full_name || 'Unknown' : ''}
          onEditTerms={() => selectedContract && handleEditTerms(selectedContract)}
          onUploadComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
            if (selectedContract) {
              // Update selected contract to reflect changes (optional, but good for UI consistency)
              // Ideally we should refetch or update the local state.
              // For now, invalidation handles the list.
            }
          }}
        />

        <EditTermsDialog
          open={editTermsDialogOpen}
          onOpenChange={setEditTermsDialogOpen}
          terms={editingTerms}
          onTermsChange={setEditingTerms}
          onSave={handleSaveTerms}
          isSaving={updateTermsMutation.isPending}
        />

        <DeleteContractDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteContractMutation.isPending}
        />
      </div>
    </MerchantLayout>
  );
}
