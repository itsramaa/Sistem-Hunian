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
  } = useContractActions();

  const setPage = (p: number) => {
    if (activeTab === 'draft') setDraftPage(p);
    else if (activeTab === 'active') setActivePage(p);
    else if (activeTab === 'pending') setPendingPage(p);
    else setPastPage(p);
  };

  // Reset page when filters or tab change
  useEffect(() => {
    setDraftPage(1);
    setActivePage(1);
    setPendingPage(1);
    setPastPage(1);
  }, [debouncedSearch, statusFilter, activeTab]);

  const merchantTenantsQuery = useMerchantTenants(merchant?.id);
  const merchantTenants = merchantTenantsQuery.data || [];
  const propertiesQuery = usePropertiesWithUnits(merchant?.id || '');
  const properties = propertiesQuery.data || [];
  const tenantUserIds = (contracts || []).map(c => c.tenant_user_id);
  const profilesQuery = useTenantProfiles(tenantUserIds);
  const profileMap = useMemo(() => {
    const map = new Map<string, any>();
    (profilesQuery.data || []).forEach((p: any) => {
      map.set(p.user_id, { user_id: p.user_id, full_name: p.full_name, email: p.email });
    });
    return map;
  }, [profilesQuery.data]);

  const availableUnits = properties?.flatMap(p => 
    (p as any).units?.filter((u: any) => u.status === 'vacant').map((u: any) => ({
      ...u,
      propertyName: (p as any).name
    }))
  ) || [];

  const filteredContracts = useMemo(() => {
    return (contracts || []).filter(contract => {
      const tenantName = profileMap.get(contract.tenant_user_id)?.full_name || '';
      const matchesSearch = 
        contract.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tenantName.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [contracts, debouncedSearch, statusFilter, profileMap]);

  const activeContracts = useMemo(() => filteredContracts.filter(c => 
    c.status === 'active' || c.status === 'notice'
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
    <div className="space-y-6">
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
              canDelete={() => true}
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
              canDelete={() => true}
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
              canDelete={() => true}
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
              canDelete={() => true}
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
          availableUnits={availableUnits}
          merchantTenants={merchantTenants as any}
          onSubmit={createContractAction}
          loading={createContractMutation.isPending}
        />

        <SignContractDialog
          open={signDialogOpen}
          onOpenChange={setSignDialogOpen}
          contract={selectedContract}
          tenantName={selectedContract ? profileMap.get(selectedContract.tenant_user_id)?.full_name || 'Unknown' : ''}
          onSign={handleSignContract}
          loading={signContractMutation.isPending}
          signatureDataUrl={signatureDataUrl || ''}
          onSaveSignature={handleSaveSignature}
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
          contract={selectedContract}
          tenantName={selectedContract ? profileMap.get(selectedContract.tenant_user_id)?.full_name || 'Unknown' : ''}
          terms={editingTerms}
          onTermsChange={setEditingTerms}
          onSave={handleSaveTerms}
          loading={updateTermsMutation.isPending}
        />

        <DeleteContractDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          contract={selectedContract}
          onConfirm={handleConfirmDelete}
          loading={deleteContractMutation.isPending}
        />
      </div>
    </div>
  );
}
