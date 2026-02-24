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
import { Plus, Wrench } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

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

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    urgent: requests.filter(r => r.priority === 'urgent' && r.status !== 'completed' && r.status !== 'cancelled').length,
    slaBreach: requests.filter(r => r.sla_deadline && new Date(r.sla_deadline) < new Date() && r.status !== 'completed' && r.status !== 'cancelled').length,
  }), [requests]);

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
    return <TabsPageSkeleton statsCount={6} />;
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
        pending={stats.pending}
        inProgress={stats.inProgress}
        completed={stats.completed}
        urgent={stats.urgent}
        slaBreach={stats.slaBreach}
        loading={isLoading}
      />

      <MaintenanceFilters
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

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
