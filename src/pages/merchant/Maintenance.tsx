import { useAuth } from '@/features/auth/hooks/useAuth';
import { MaintenanceFilters } from '@/features/maintenance/components/MaintenanceFilters';
import { MaintenanceRequestTable } from '@/features/maintenance/components/MaintenanceRequestTable';
import { MaintenanceStats } from '@/features/maintenance/components/MaintenanceStats';
import { UpdateMaintenanceDialog } from '@/features/maintenance/components/UpdateMaintenanceDialog';
import { CreateMaintenanceDialog } from '@/features/maintenance/components/CreateMaintenanceDialog';
import { useMerchantMaintenanceRequests, useUpdateMaintenanceRequest, useVerifiedVendors, useCreateMerchantMaintenanceRequest } from '@/features/maintenance/hooks/useMaintenance';
import { MaintenanceRequest, CreateMerchantMaintenancePayload, UpdateMaintenanceStatusPayload } from '@/features/maintenance/types';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { TabsPageSkeleton } from '@/shared/components/ui/PageSkeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Plus, Wrench } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const STATUS_TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export default function MerchantMaintenance() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [page, setPage] = useState(1);

  const { data: requests = [], isLoading } = useMerchantMaintenanceRequests(merchant?.id);
  const { data: vendors = [] } = useVerifiedVendors();
  const updateMutation = useUpdateMaintenanceRequest();
  const createMerchantMutation = useCreateMerchantMaintenanceRequest();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, categoryFilter]);

  const filteredRequests = useMemo(() => requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      request.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  }), [requests, debouncedSearch, statusFilter, priorityFilter, categoryFilter]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, page]);

  const activeRequests = useMemo(() => requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled'), [requests]);

  const stats = useMemo(() => ({
    total: requests.length,
    low: activeRequests.filter(r => r.priority === 'low').length,
    medium: activeRequests.filter(r => r.priority === 'medium').length,
    high: activeRequests.filter(r => r.priority === 'high').length,
    urgent: activeRequests.filter(r => r.priority === 'urgent').length,
  }), [requests, activeRequests]);

  const handleUpdateStatus = (data: UpdateMaintenanceStatusPayload) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Request updated successfully' });
        setSelectedRequest(null);
      },
      onError: (error: Error) => {
        toast({ title: 'Gagal memperbarui permintaan', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleCreateMerchantMaintenance = (data: CreateMerchantMaintenancePayload) => {
    createMerchantMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Maintenance berhasil dibuat' });
        setShowCreateDialog(false);
      },
      onError: (error: Error) => {
        toast({ title: 'Gagal membuat maintenance', description: error.message, variant: 'destructive' });
      }
    });
  };

  if (isLoading && requests.length === 0) {
    return <TabsPageSkeleton statsCount={4} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Maintenance"
        description="Kelola permintaan pemeliharaan properti Anda"
      >
        <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl gradient-cta">
          <Plus className="h-4 w-4 mr-1" />Tambah Maintenance
        </Button>
      </PageHeader>

      <MaintenanceStats
        total={stats.total}
        low={stats.low}
        medium={stats.medium}
        high={stats.high}
        urgent={stats.urgent}
        loading={isLoading}
      />

      {/* Filters + Table in card */}
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-4 space-y-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="pill-tab-list w-full sm:w-auto">
            {STATUS_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="pill-tab-trigger">
                {tab.label}
                {tab.value !== 'all' && (
                  <span className="ml-1.5 text-[10px] bg-muted/60 px-1.5 py-0.5 rounded-full">
                    {requests.filter(r => r.status === tab.value).length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <MaintenanceFilters
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
        />
      </div>

      <MaintenanceRequestTable 
        requests={paginatedRequests}
        loading={isLoading}
        onEdit={setSelectedRequest}
        page={page}
        totalPages={Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)}
        totalRequests={filteredRequests.length}
        onPageChange={setPage}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      <CreateMaintenanceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateMerchantMaintenance}
        loading={createMerchantMutation.isPending}
      />

      <UpdateMaintenanceDialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
        request={selectedRequest}
        vendors={vendors}
        onSubmit={handleUpdateStatus}
        loading={updateMutation.isPending}
      />
    </div>
  );
}
