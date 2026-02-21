import { AdminPropertiesStats } from "@/features/properties/components/admin/AdminPropertiesStats";
import { AdminPropertiesTable } from "@/features/properties/components/admin/AdminPropertiesTable";
import { AdminPropertyFilters } from "@/features/properties/components/admin/AdminPropertyFilters";
import { useAdminProperties, useUpdatePropertyStatus } from "@/features/properties/hooks/useAdminProperties";
import { AdminProperty } from "@/features/properties/types/admin";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminProperties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: properties = [], isLoading } = useAdminProperties();
  const updateStatus = useUpdatePropertyStatus();

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    const matchesType = typeFilter === "all" || property.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusChange = (id: string, newStatus: AdminProperty["status"]) => {
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Property status updated to ${newStatus}`);
        },
        onError: (error) => {
          toast.error(`Failed to update status: ${error.message}`);
        },
      }
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  if (isLoading) {
    return (
      <AdminLayout
        title="Properties Management"
        description="Monitor and manage property listings."
      >
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Properties Management"
      description="Monitor and manage property listings."
    >
      <div className="space-y-6">
        <AdminPropertiesStats properties={properties} />

        <div className="space-y-4">
          <AdminPropertyFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            onResetFilters={handleResetFilters}
          />

          <AdminPropertiesTable
            properties={filteredProperties}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
