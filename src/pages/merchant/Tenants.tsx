import { useAuth } from '@/features/auth/hooks/useAuth';
import { TenantsTable } from "@/features/users/components/tables/TenantsTable";
import { InvitationsTable } from '@/features/users/components/tenant/InvitationsTable';
import { InviteTenantDialog } from '@/features/users/components/tenant/InviteTenantDialog';
import { TenantDetailsDialog } from '@/features/users/components/tenant/TenantDetailsDialog';
import { TenantsFilters } from '@/features/users/components/tenant/TenantsFilters';
import { TenantStats } from '@/features/users/components/tenant/TenantStats';
import {
  useMerchantActiveContractsCount,
  useMerchantActiveTenants,
  useMerchantInvitations,
  useMerchantPropertiesWithUnits,
  useMerchantTenantMutations,
} from '@/features/users/hooks/useMerchantTenants';
import { ActiveTenant, InvitationFormData } from '@/features/users/types/tenant';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function MerchantTenants() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<ActiveTenant | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<ActiveTenant | null>(null);
  const [activeTab, setActiveTab] = useState('invitations');
  
  // Pagination state
  const [invitationPage, setInvitationPage] = useState(1);
  const [activeTenantPage, setActiveTenantPage] = useState(1);

  const { toast } = useToast();
  const { merchant } = useAuth();

  // Reset pagination when filters change
  useEffect(() => {
    setInvitationPage(1);
    setActiveTenantPage(1);
  }, [debouncedSearch, statusFilter]);

  // Custom hooks for data fetching
  const { 
    data: properties = [], 
    isLoading: propertiesLoading, 
    error: propertiesError 
  } = useMerchantPropertiesWithUnits(merchant?.id);

  const { 
    data: invitations = [], 
    isLoading: invitationsLoading, 
    error: invitationsError,
    refetch: refetchInvitations 
  } = useMerchantInvitations(merchant?.id);

  const { 
    data: activeTenants = [], 
    isLoading: tenantsLoading, 
    error: tenantsError,
    refetch: refetchTenants 
  } = useMerchantActiveTenants(merchant?.id);

  const { data: activeContractsCount = 0 } = useMerchantActiveContractsCount(merchant?.id);

  // Mutations
  const { sendInvitation, cancelInvitation, terminateContract } = useMerchantTenantMutations(merchant?.id);

  const loading = propertiesLoading || invitationsLoading || tenantsLoading;
  const hasError = propertiesError || invitationsError || tenantsError;

  // Memoize available units calculation
  const availableUnits = useMemo(() => 
    properties.flatMap(p => 
      (p.units || [])
        .filter(u => u.status === 'available')
        .map(u => ({ ...u, propertyName: p.name }))
    ), [properties]
  );

  // Memoize filtered invitations
  const filteredInvitations = useMemo(() => 
    invitations.filter(inv => {
      const matchesSearch = inv.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        inv.unit?.property?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        inv.unit?.unit_number?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    }), [invitations, debouncedSearch, statusFilter]
  );

  // Memoize paginated invitations
  const paginatedInvitations = useMemo(() => {
    const start = (invitationPage - 1) * ITEMS_PER_PAGE;
    return filteredInvitations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvitations, invitationPage]);

  // Memoize filtered active tenants
  const filteredActiveTenants = useMemo(() => 
    activeTenants.filter(tenant => {
      const matchesSearch = 
        tenant.profile?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tenant.profile?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tenant.unit?.property?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tenant.unit?.unit_number?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    }), [activeTenants, debouncedSearch]
  );

  // Memoize paginated active tenants
  const paginatedActiveTenants = useMemo(() => {
    const start = (activeTenantPage - 1) * ITEMS_PER_PAGE;
    return filteredActiveTenants.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActiveTenants, activeTenantPage]);

  const handleInviteSubmit = (data: InvitationFormData) => {
    sendInvitation.mutate(data, {
      onSuccess: () => {
        setShowInviteDialog(false);
      }
    });
  };

  const handleCancelInvitation = (id: string) => {
    cancelInvitation.mutate(id);
  };

  const handleViewDetail = (tenant: ActiveTenant) => {
    setSelectedTenant(tenant);
    setShowDetailDialog(true);
  };

  const handleDeleteTenant = (tenant: ActiveTenant) => {
    setTenantToDelete(tenant);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTenant = () => {
    if (tenantToDelete) {
      terminateContract.mutate(tenantToDelete, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setTenantToDelete(null);
        }
      });
    }
  };

  if (hasError) {
    return (
      <MerchantLayout title="Tenants" description="Manage tenant invitations and active tenants">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load data</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              There was an error loading tenant data. Please try again.
            </p>
            <Button onClick={() => { refetchInvitations(); refetchTenants(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout
      title="Tenants"
      description="Manage tenant invitations and active tenants"
      actions={
        <Button onClick={() => setShowInviteDialog(true)} disabled={availableUnits.length === 0}>
          <Send className="h-4 w-4 mr-2" />
          Send Invitation
        </Button>
      }
    >
      <div className="space-y-6">
        <TenantStats
          pendingInvitationsCount={invitations.filter(i => i.status === 'pending').length}
          activeTenantsCount={activeContractsCount}
          availableUnitsCount={availableUnits.length}
          loading={loading}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="invitations">
              Invitations
              {invitations.filter(i => i.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {invitations.filter(i => i.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Tenants
              {activeTenants.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeTenants.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TenantsFilters
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            className="mt-4"
          />

          <TabsContent value="invitations" className="mt-4">
            <InvitationsTable
              invitations={paginatedInvitations}
              onCancel={handleCancelInvitation}
              loading={loading}
              cancelLoadingId={cancelInvitation.variables as string}
              page={invitationPage}
              totalPages={Math.ceil(filteredInvitations.length / ITEMS_PER_PAGE)}
              totalInvitations={filteredInvitations.length}
              onPageChange={setInvitationPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <TenantsTable
              tenants={paginatedActiveTenants}
              mode="merchant"
              onViewDetails={handleViewDetail}
              onTerminate={handleDeleteTenant}
              isLoading={loading}
              page={activeTenantPage}
              totalPages={Math.ceil(filteredActiveTenants.length / ITEMS_PER_PAGE)}
              totalCount={filteredActiveTenants.length}
              onPageChange={setActiveTenantPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </TabsContent>
        </Tabs>
      </div>

      <InviteTenantDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        availableUnits={availableUnits}
        onSubmit={handleInviteSubmit}
        isLoading={sendInvitation.isPending}
      />

      <TenantDetailsDialog
        tenant={selectedTenant}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{tenantToDelete?.profile?.full_name || 'this tenant'}</strong> from <strong>Unit {tenantToDelete?.unit?.unit_number}</strong>?
              <br /><br />
              This will:
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Terminate the current contract</li>
                <li>Mark the unit as available</li>
                <li>Remove the tenant's access to this unit</li>
              </ul>
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteTenant}
              disabled={terminateContract.isPending}
            >
              {terminateContract.isPending ? 'Removing...' : 'Remove Tenant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MerchantLayout>
  );
}
