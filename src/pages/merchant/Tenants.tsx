import { useAuth } from '@/features/auth/hooks/useAuth';
import { TenantsTable } from "@/features/users/components/tables/TenantsTable";
import { InvitationsTable } from '@/features/users/components/tenant/InvitationsTable';
import { InviteTenantDialog } from '@/features/users/components/tenant/InviteTenantDialog';
import { AddTenantDialog } from '@/features/users/components/tenant/AddTenantDialog';
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
import { ActiveTenant } from '@/features/users/types/tenant';
import { InvitationFormData } from '@/features/users/types/schema';
import { AddTenantFormData } from '@/features/users/types/addTenantSchema';

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
import { AlertTriangle, Plus, RefreshCw, Send, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function MerchantTenants() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<ActiveTenant | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<ActiveTenant | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  
  const [invitationPage, setInvitationPage] = useState(1);
  const [activeTenantPage, setActiveTenantPage] = useState(1);

  const { toast } = useToast();
  const { merchant } = useAuth();

  useEffect(() => {
    setInvitationPage(1);
    setActiveTenantPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError } = useMerchantPropertiesWithUnits(merchant?.id);
  const { data: invitations = [], isLoading: invitationsLoading, error: invitationsError, refetch: refetchInvitations } = useMerchantInvitations(merchant?.id);
  const { data: activeTenants = [], isLoading: tenantsLoading, error: tenantsError, refetch: refetchTenants } = useMerchantActiveTenants(merchant?.id);
  const { data: activeContractsCount = 0 } = useMerchantActiveContractsCount(merchant?.id);

  const { sendInvitation, cancelInvitation, terminateContract, addTenantDirectly, unlinkTenant } = useMerchantTenantMutations(merchant?.id);

  const loading = propertiesLoading || invitationsLoading || tenantsLoading;
  const hasError = propertiesError || invitationsError || tenantsError;

  const availableUnits = useMemo(() => 
    properties.flatMap((p: any) => 
      ((p as any).units || [])
        .filter((u: any) => u.status === 'available')
        .map((u: any) => ({ ...u, propertyName: p.name }))
    ), [properties]
  );

  const filteredInvitations = useMemo(() => 
    invitations.filter(inv => {
      const matchesSearch = inv.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        inv.unit?.property?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        inv.unit?.unit_number?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    }), [invitations, debouncedSearch, statusFilter]
  );

  const paginatedInvitations = useMemo(() => {
    const start = (invitationPage - 1) * ITEMS_PER_PAGE;
    return filteredInvitations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvitations, invitationPage]);

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

  const paginatedActiveTenants = useMemo(() => {
    const start = (activeTenantPage - 1) * ITEMS_PER_PAGE;
    return filteredActiveTenants.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActiveTenants, activeTenantPage]);

  const handleInviteSubmit = (data: InvitationFormData) => {
    sendInvitation.mutate(data as { property_id: string; email: string; phone?: string }, { onSuccess: () => setShowInviteDialog(false) });
  };

  const handleAddTenantSubmit = (data: AddTenantFormData) => {
    addTenantDirectly.mutate(data, { onSuccess: () => setShowAddDialog(false) });
  };

  const handleCancelInvitation = (id: string) => cancelInvitation.mutate(id);

  const handleViewDetail = (tenant: ActiveTenant) => {
    setSelectedTenant(tenant);
    setShowDetailDialog(true);
  };

  const handleDeleteTenant = (tenant: ActiveTenant) => {
    setTenantToDelete(tenant);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTenant = () => {
    if (!tenantToDelete) return;
    
    if (tenantToDelete.status === 'linked') {
      // Unlink tenant (no contract to terminate)
      unlinkTenant.mutate(tenantToDelete.tenant_user_id, {
        onSuccess: () => { setShowDeleteDialog(false); setTenantToDelete(null); }
      });
    } else {
      // Terminate contract
      terminateContract.mutate(tenantToDelete, {
        onSuccess: () => { setShowDeleteDialog(false); setTenantToDelete(null); }
      });
    }
  };

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  if (hasError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load data</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">There was an error loading tenant data.</p>
          <Button onClick={() => { refetchInvitations(); refetchTenants(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Tenant
          </Button>
          <Button onClick={() => setShowInviteDialog(true)} disabled={properties.length === 0}>
            <Send className="h-4 w-4 mr-2" />Kirim Undangan
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <TenantStats
          pendingInvitationsCount={pendingCount}
          activeTenantsCount={activeTenants.length}
          availableUnitsCount={availableUnits.length}
          loading={loading}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="invitations" className="relative">
              Invitations
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2 animate-pulse bg-warning/20 text-warning border-warning/30">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Tenants
              {activeTenants.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeTenants.length}</Badge>
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
            {!loading && filteredInvitations.length === 0 && invitations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
                    <Send className="h-8 w-8 text-warning/60" />
                  </div>
                  <h3 className="font-medium mb-1">No invitations yet</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                    Send invitations to your tenants to get them onboarded to the platform.
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)} disabled={properties.length === 0}>
                    <Send className="h-4 w-4 mr-2" />Kirim Undangan
                  </Button>
                </CardContent>
              </Card>
            ) : (
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
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            {!loading && filteredActiveTenants.length === 0 && activeTenants.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-success/60" />
                  </div>
                  <h3 className="font-medium mb-1">No active tenants</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                    Add tenants directly or invite them to get started.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />Add Tenant
                    </Button>
                    <Button onClick={() => setShowInviteDialog(true)} disabled={properties.length === 0}>
                      <Send className="h-4 w-4 mr-2" />Kirim Undangan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
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
            )}
          </TabsContent>
        </Tabs>
      </div>

      <InviteTenantDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        properties={properties.map((p: any) => ({ id: p.id, name: p.name }))}
        onSubmit={handleInviteSubmit}
        isLoading={sendInvitation.isPending}
      />

      <AddTenantDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        properties={properties as any}
        onSubmit={handleAddTenantSubmit}
        isLoading={addTenantDirectly.isPending}
      />

      <TenantDetailsDialog
        tenant={selectedTenant}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tenantToDelete?.status === 'linked' ? 'Lepas Tenant' : 'Hapus Tenant'}</AlertDialogTitle>
            <AlertDialogDescription>
              {tenantToDelete?.status === 'linked' ? (
                <>
                  Apakah Anda yakin ingin melepas <strong>{tenantToDelete?.profile?.full_name || 'tenant ini'}</strong> dari merchant Anda?
                  <br /><br />
                  Tenant hanya akan dilepas dari daftar Anda, akun mereka tetap ada.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus <strong>{tenantToDelete?.profile?.full_name || 'tenant ini'}</strong> dari <strong>Unit {tenantToDelete?.unit?.unit_number}</strong>?
                  <br /><br />
                  Ini akan:
                  <ul className="list-disc pl-4 mt-2 space-y-1">
                    <li>Mengakhiri kontrak saat ini</li>
                    <li>Menandai unit sebagai tersedia</li>
                    <li>Mencabut akses tenant ke unit ini</li>
                  </ul>
                </>
              )}
              <br />
              <span className="text-destructive font-medium">Tindakan ini tidak dapat dibatalkan.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteTenant}
              disabled={terminateContract.isPending || unlinkTenant.isPending}
            >
              {(terminateContract.isPending || unlinkTenant.isPending) ? 'Memproses...' : tenantToDelete?.status === 'linked' ? 'Lepas Tenant' : 'Hapus Tenant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
