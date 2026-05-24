
import { useAdminProperties } from "@/features/properties/hooks/useAdminProperties";
import { AdminTenantFilters } from "@/features/users/components/admin/AdminTenantFilters";
import { AdminTenantsTable } from "@/features/users/components/admin/AdminTenantsTable";
import { AdminTenantStats } from "@/features/users/components/admin/AdminTenantStats";
import { TenantDetailsDialog } from "@/features/users/components/admin/TenantDetailsDialog";
import { useAdminMerchants } from "@/features/users/hooks/useAdminMerchants";
import { useAdminTenants } from "@/features/users/hooks/useAdminTenants";
import { useAdminTenantStats } from "@/features/users/hooks/useAdminTenantStats";
import { adminTenantService } from "@/features/users/services/adminTenantService";
import { AdminTenant } from "@/features/users/types/tenant";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function Tenants() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [merchantFilter, setMerchantFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [minRent, setMinRent] = useState<string>("");
  const [maxRent, setMaxRent] = useState<string>("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: tenantsData, isLoading: isLoadingTenants, refetch } = useAdminTenants(
    page, 
    itemsPerPage, 
    debouncedSearch, 
    statusFilter, 
    merchantFilter, 
    propertyFilter,
    minRent,
    maxRent
  );
  const { data: stats, isLoading: isLoadingStats } = useAdminTenantStats();
  const { data: merchants } = useAdminMerchants();
  const { data: properties } = useAdminProperties();

  const [selectedTenant, setSelectedTenant] = useState<AdminTenant | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { mutate: updateTenantStatus } = useMutation({
    mutationFn: (params: { id: string; status: string }) => adminTenantService.updateTenantStatus(params.id, params.status),
    onSuccess: () => {
      toast.success(`Status penyewa berhasil diperbarui.`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui status penyewa: ${error.message}`);
    },
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    updateTenantStatus({ id, status: newStatus });
  };

  const viewDetails = (tenant: AdminTenant) => {
    setSelectedTenant(tenant);
    setShowDetailsDialog(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleMerchantFilterChange = (value: string) => {
    setMerchantFilter(value);
    setPage(1);
  };

  const handlePropertyFilterChange = (value: string) => {
    setPropertyFilter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMerchantFilter("all");
    setPropertyFilter("all");
    setMinRent("");
    setMaxRent("");
    setPage(1);
  };

  return (
    <AdminLayout
      title="Manajemen Penyewa"
      description="Pantau akun penyewa di semua merchant dan properti."
    >
      <div className="space-y-6">
        <AdminTenantStats stats={stats} isLoading={isLoadingStats} />

        <AdminTenantFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          merchantFilter={merchantFilter}
          onMerchantFilterChange={handleMerchantFilterChange}
          propertyFilter={propertyFilter}
          onPropertyFilterChange={handlePropertyFilterChange}
          minRent={minRent}
          onMinRentChange={(val) => { setMinRent(val); setPage(1); }}
          maxRent={maxRent}
          onMaxRentChange={(val) => { setMaxRent(val); setPage(1); }}
          merchants={merchants || []}
          properties={(properties || []) as any}
          onResetFilters={handleResetFilters}
        />

        <AdminTenantsTable
          tenants={tenantsData?.data || []}
          onTerminate={(tenant) => handleStatusChange(tenant.id, "terminated")}
          onViewDetails={viewDetails}
          page={page}
          totalPages={Math.ceil((tenantsData?.count || 0) / itemsPerPage)}
          totalCount={tenantsData?.count || 0}
          onPageChange={setPage}
          itemsPerPage={itemsPerPage}
          isLoading={isLoadingTenants}
        />

        <TenantDetailsDialog
          tenant={selectedTenant}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      </div>
    </AdminLayout>
  );
}
