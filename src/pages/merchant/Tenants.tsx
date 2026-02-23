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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { AlertTriangle, CalendarClock, Plus, RefreshCw, Send, Users, CircleDollarSign, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { differenceInDays } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export default function MerchantTenants() {
  const navigate = useNavigate();
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

  useEffect(() => { setInvitationPage(1); setActiveTenantPage(1); }, [debouncedSearch, statusFilter]);

  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError } = useMerchantPropertiesWithUnits(merchant?.id);
  const { data: invitations = [], isLoading: invitationsLoading, error: invitationsError, refetch: refetchInvitations } = useMerchantInvitations(merchant?.id);
  const { data: activeTenants = [], isLoading: tenantsLoading, error: tenantsError, refetch: refetchTenants } = useMerchantActiveTenants(merchant?.id);
  const { data: activeContractsCount = 0 } = useMerchantActiveContractsCount(merchant?.id);

  const { sendInvitation, cancelInvitation, terminateContract, addTenantDirectly, unlinkTenant } = useMerchantTenantMutations(merchant?.id);

  const loading = propertiesLoading || invitationsLoading || tenantsLoading;
  const hasError = propertiesError || invitationsError || tenantsError;

  const availableUnits = useMemo(() => 
    properties.flatMap((p: any) => ((p as any).units || []).filter((u: any) => u.status === 'available').map((u: any) => ({ ...u, propertyName: p.name }))), [properties]
  );

  // Lifecycle computed data
  const expiringTenants = useMemo(() => 
    activeTenants.filter(t => t.end_date && differenceInDays(new Date(t.end_date), new Date()) <= 30 && differenceInDays(new Date(t.end_date), new Date()) >= 0), [activeTenants]
  );

  const filteredInvitations = useMemo(() => 
    invitations.filter(inv => {
      const matchesSearch = inv.email.toLowerCase().includes(debouncedSearch.toLowerCase()) || inv.unit?.property?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || inv.unit?.unit_number?.toLowerCase().includes(debouncedSearch.toLowerCase());
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
      const matchesSearch = tenant.profile?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || tenant.profile?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) || tenant.unit?.property?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || tenant.unit?.unit_number?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    }), [activeTenants, debouncedSearch]
  );

  // Filter for expiring tab
  const filteredExpiringTenants = useMemo(() => {
    if (activeTab !== 'expiring') return [];
    return expiringTenants.filter(tenant => {
      const matchesSearch = tenant.profile?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || tenant.profile?.email?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    });
  }, [expiringTenants, debouncedSearch, activeTab]);

  const paginatedActiveTenants = useMemo(() => {
    const start = (activeTenantPage - 1) * ITEMS_PER_PAGE;
    if (activeTab === 'expiring') return filteredExpiringTenants.slice(start, start + ITEMS_PER_PAGE);
    return filteredActiveTenants.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActiveTenants, filteredExpiringTenants, activeTenantPage, activeTab]);

  const currentTotal = activeTab === 'expiring' ? filteredExpiringTenants.length : filteredActiveTenants.length;

  const handleInviteSubmit = (data: InvitationFormData) => {
    sendInvitation.mutate(data as { property_id: string; email: string; phone?: string }, { onSuccess: () => setShowInviteDialog(false) });
  };

  const handleAddTenantSubmit = (data: AddTenantFormData) => {
    addTenantDirectly.mutate(data, { onSuccess: () => setShowAddDialog(false) });
  };

  const handleCancelInvitation = (id: string) => cancelInvitation.mutate(id);
  const handleViewDetail = (tenant: ActiveTenant) => { setSelectedTenant(tenant); setShowDetailDialog(true); };
  const handleDeleteTenant = (tenant: ActiveTenant) => { setTenantToDelete(tenant); setShowDeleteDialog(true); };

  const confirmDeleteTenant = () => {
    if (!tenantToDelete) return;
    if (tenantToDelete.status === 'linked') {
      unlinkTenant.mutate(tenantToDelete.tenant_user_id, { onSuccess: () => { setShowDeleteDialog(false); setTenantToDelete(null); } });
    } else {
      terminateContract.mutate(tenantToDelete, { onSuccess: () => { setShowDeleteDialog(false); setTenantToDelete(null); } });
    }
  };

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  if (hasError) {
    return (
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Gagal memuat data</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">Terjadi kesalahan saat memuat data tenant.</p>
          <Button onClick={() => { refetchInvitations(); refetchTenants(); }} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" />Coba Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PageHeader icon={Users} title="Manajemen Tenant" description="Kelola tenant aktif dan undangan">
        <Button variant="outline" onClick={() => navigate('/merchant/move-outs')} className="rounded-xl gap-2">
          <LogOut className="h-4 w-4" />Pindah Keluar
        </Button>
        <Button onClick={() => setShowInviteDialog(true)} disabled={properties.length === 0} className="rounded-xl gradient-cta text-primary-foreground hover:opacity-90 gap-2">
          <Send className="h-4 w-4" />Kirim Undangan
        </Button>
        <Button variant="outline" onClick={() => setShowAddDialog(true)} title="Untuk tenant yang sudah terdaftar di sistem" className="rounded-xl gap-2">
          <Plus className="h-4 w-4" />Tambah Langsung
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <TenantStats
          pendingInvitationsCount={pendingCount}
          activeTenantsCount={activeTenants.length}
          availableUnitsCount={availableUnits.length}
          expiringContractsCount={expiringTenants.length}
          loading={loading}
        />

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setActiveTenantPage(1); }} className="w-full">
          <TabsList className="pill-tab-list w-full max-w-lg sm:w-auto">
            <TabsTrigger value="active" className="pill-tab-trigger">
              Tenant Aktif
              {activeTenants.length > 0 && <Badge variant="secondary" className="ml-2 rounded-full">{activeTenants.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="expiring" className="pill-tab-trigger">
              Segera Berakhir
              {expiringTenants.length > 0 && <Badge variant="secondary" className="ml-2 rounded-full bg-warning/20 text-warning border-warning/30">{expiringTenants.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="invitations" className="pill-tab-trigger relative">
              Undangan
              {pendingCount > 0 && <Badge variant="secondary" className="ml-2 animate-pulse bg-warning/20 text-warning border-warning/30 rounded-full">{pendingCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TenantsFilters activeTab={activeTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} className="mt-4" />

          <TabsContent value="invitations" className="mt-4">
            {!loading && filteredInvitations.length === 0 && invitations.length === 0 ? (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4"><Send className="h-8 w-8 text-warning/60" /></div>
                  <h3 className="font-medium mb-1">Belum ada undangan</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">Kirim undangan ke tenant Anda agar mereka bisa bergabung ke platform.</p>
                  <Button onClick={() => setShowInviteDialog(true)} disabled={properties.length === 0} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md"><Send className="h-4 w-4 mr-2" />Kirim Undangan</Button>
                </CardContent>
              </Card>
            ) : (
              <InvitationsTable invitations={paginatedInvitations} onCancel={handleCancelInvitation} loading={loading} cancelLoadingId={cancelInvitation.variables as string} page={invitationPage} totalPages={Math.ceil(filteredInvitations.length / ITEMS_PER_PAGE)} totalInvitations={filteredInvitations.length} onPageChange={setInvitationPage} itemsPerPage={ITEMS_PER_PAGE} />
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            {!loading && filteredActiveTenants.length === 0 && activeTenants.length === 0 ? (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4"><Users className="h-8 w-8 text-success/60" /></div>
                  <h3 className="font-medium mb-1">Belum ada tenant aktif</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">Tambahkan tenant langsung atau kirim undangan untuk memulai.</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowInviteDialog(true)} disabled={properties.length === 0} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md"><Send className="h-4 w-4 mr-2" />Kirim Undangan</Button>
                    <Button variant="outline" onClick={() => setShowAddDialog(true)} className="rounded-xl"><Plus className="h-4 w-4 mr-2" />Tambah Langsung</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <TenantsTable tenants={paginatedActiveTenants} mode="merchant" onViewDetails={handleViewDetail} onTerminate={handleDeleteTenant} isLoading={loading} page={activeTenantPage} totalPages={Math.ceil(currentTotal / ITEMS_PER_PAGE)} totalCount={currentTotal} onPageChange={setActiveTenantPage} itemsPerPage={ITEMS_PER_PAGE} />
            )}
          </TabsContent>

          <TabsContent value="expiring" className="mt-4">
            {!loading && expiringTenants.length === 0 ? (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4"><CalendarClock className="h-8 w-8 text-success/60" /></div>
                  <h3 className="font-medium mb-1">Tidak ada kontrak segera berakhir</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">Semua kontrak masih dalam masa aktif yang cukup panjang.</p>
                </CardContent>
              </Card>
            ) : (
              <TenantsTable tenants={paginatedActiveTenants} mode="merchant" onViewDetails={handleViewDetail} onTerminate={handleDeleteTenant} isLoading={loading} page={activeTenantPage} totalPages={Math.ceil(currentTotal / ITEMS_PER_PAGE)} totalCount={currentTotal} onPageChange={setActiveTenantPage} itemsPerPage={ITEMS_PER_PAGE} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <InviteTenantDialog open={showInviteDialog} onOpenChange={setShowInviteDialog} properties={properties.map((p: any) => ({ id: p.id, name: p.name }))} onSubmit={handleInviteSubmit} isLoading={sendInvitation.isPending} />
      <AddTenantDialog open={showAddDialog} onOpenChange={setShowAddDialog} properties={properties as any} onSubmit={handleAddTenantSubmit} isLoading={addTenantDirectly.isPending} />
      <TenantDetailsDialog tenant={selectedTenant} open={showDetailDialog} onOpenChange={setShowDetailDialog} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl bg-card/95 backdrop-blur-xl border border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>{tenantToDelete?.status === 'linked' ? 'Lepas Tenant' : 'Hapus Tenant'}</AlertDialogTitle>
            <AlertDialogDescription>
              {tenantToDelete?.status === 'linked' ? (
                <>Apakah Anda yakin ingin melepas <strong>{tenantToDelete?.profile?.full_name || 'tenant ini'}</strong> dari merchant Anda?<br /><br />Tenant hanya akan dilepas dari daftar Anda, akun mereka tetap ada.</>
              ) : (
                <>Apakah Anda yakin ingin menghapus <strong>{tenantToDelete?.profile?.full_name || 'tenant ini'}</strong> dari <strong>Unit {tenantToDelete?.unit?.unit_number}</strong>?<br /><br />Ini akan:
                  <ul className="list-disc pl-4 mt-2 space-y-1"><li>Mengakhiri kontrak saat ini</li><li>Menandai unit sebagai tersedia</li><li>Mencabut akses tenant ke unit ini</li></ul>
                </>
              )}
              <br /><span className="text-destructive font-medium">Tindakan ini tidak dapat dibatalkan.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl" onClick={confirmDeleteTenant} disabled={terminateContract.isPending || unlinkTenant.isPending}>
              {(terminateContract.isPending || unlinkTenant.isPending) ? 'Memproses...' : tenantToDelete?.status === 'linked' ? 'Lepas Tenant' : 'Hapus Tenant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
