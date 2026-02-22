import { useAuth } from '@/features/auth/hooks/useAuth';
import { MaintenanceFilters } from '@/features/maintenance/components/MaintenanceFilters';
import { MaintenanceRequestTable } from '@/features/maintenance/components/MaintenanceRequestTable';
import { MaintenanceStats } from '@/features/maintenance/components/MaintenanceStats';
import { UpdateMaintenanceDialog } from '@/features/maintenance/components/UpdateMaintenanceDialog';
import { useMerchantMaintenanceRequests, useUpdateMaintenanceRequest, useVerifiedVendors } from '@/features/maintenance/hooks/useMaintenance';
import { MaintenanceRequest, UpdateMaintenanceStatusPayload } from '@/features/maintenance/types';

import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function MerchantMaintenance() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [page, setPage] = useState(1);

  // Fetch maintenance requests
  const { data: requests = [], isLoading } = useMerchantMaintenanceRequests(merchant?.id);

  // Fetch verified vendors
  const { data: vendors = [] } = useVerifiedVendors();

  // Update mutation
  const updateMutation = useUpdateMaintenanceRequest();

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const filteredRequests = useMemo(() => requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      request.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [requests, debouncedSearch, statusFilter]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, page]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }), [requests]);

  const handleUpdateStatus = (data: UpdateMaintenanceStatusPayload) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Request updated successfully' });
        setSelectedRequest(null);
      },
      onError: (error: Error) => {
        toast({ title: 'Failed to update request', description: error.message, variant: 'destructive' });
      }
    });
  };

  return (
    <>
      <div className="space-y-6">
        <MaintenanceStats
          total={stats.total}
          pending={stats.pending}
          inProgress={stats.inProgress}
          completed={stats.completed}
          loading={isLoading}
        />

        <MaintenanceFilters
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
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
      </div>

      <UpdateMaintenanceDialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
        request={selectedRequest}
        vendors={vendors}
        onSubmit={handleUpdateStatus}
        loading={updateMutation.isPending}
      />
    </>
  );
}
