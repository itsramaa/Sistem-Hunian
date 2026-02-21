import { useAuth } from "@/features/auth/hooks/useAuth";
import { UnitFilters } from "@/features/properties/components/UnitFilters";
import { UnitFormDialog } from "@/features/properties/components/UnitFormDialog";
import { UnitsStats } from "@/features/properties/components/UnitsStats";
import { UnitsTable } from "@/features/properties/components/UnitsTable";
import { useMerchantProperties } from "@/features/properties/hooks/useMerchantProperties";
import { useMerchantUnits } from "@/features/properties/hooks/useMerchantUnits";
import { Unit, UnitFormData } from "@/features/properties/types";
import { SubscriptionLimitWarning } from "@/features/subscriptions/components/SubscriptionLimitWarning";
import { useSubscriptionLimits } from "@/features/subscriptions/hooks/useSubscriptionLimits";
import { MerchantLayout } from "@/shared/components/layouts/MerchantLayout";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

export default function MerchantUnits() {
  const { merchant } = useAuth();
  const { data: subscriptionLimits } = useSubscriptionLimits();
  
  // State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, propertyFilter]);

  // Data Fetching
  const { properties, loading: propertiesLoading } = useMerchantProperties(merchant?.id || '');
  const { 
    units, 
    loading: unitsLoading, 
    createUnit, 
    updateUnit, 
    deleteUnit,
    isCreating,
    isUpdating,
    isDeleting
  } = useMerchantUnits(merchant?.id || '');

  // Computed
  const filteredUnits = useMemo(() => units.filter(unit => {
    const matchesSearch = unit.unit_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      unit.property?.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
    const matchesProperty = propertyFilter === 'all' || unit.property_id === propertyFilter;
    return matchesSearch && matchesStatus && matchesProperty;
  }), [units, debouncedSearch, statusFilter, propertyFilter]);

  const paginatedUnits = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUnits.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUnits, page]);

  const stats = useMemo(() => ({
    totalUnits: units.length,
    occupiedUnits: units.filter(u => u.status === 'occupied').length,
    availableUnits: units.filter(u => u.status === 'available').length,
    totalMonthlyRent: units.filter(u => u.status === 'occupied').reduce((sum, u) => sum + u.rent_amount, 0),
  }), [units]);

  const canAddUnit = !subscriptionLimits || subscriptionLimits.canAddUnit;

  // Handlers
  const handleCreate = () => {
    setEditingUnit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUnit(deleteId);
      setDeleteId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleFormSubmit = async (data: UnitFormData) => {
    try {
      if (!editingUnit && subscriptionLimits && !subscriptionLimits.canAddUnit) {
        toast.error(`Unit limit reached (${subscriptionLimits.currentUnits}/${subscriptionLimits.maxUnits}). Please upgrade your subscription.`);
        return;
      }

      // Convert form data to payload format (omit amenities if not in form)
      const payload = {
        ...data,
        amenities: [], // Default to empty array as it's not in the form yet
        property_id: editingUnit?.property_id || '',
      };

      if (editingUnit) {
        await updateUnit({ id: editingUnit.id, payload });
      } else {
        await createUnit(payload as any);
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <MerchantLayout 
      description="View and manage all your rental units"
      actions={
        <Button 
          disabled={properties.length === 0 || !canAddUnit}
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      }
    >
      {/* Subscription Warning */}
      {subscriptionLimits?.isNearUnitLimit && (
        <SubscriptionLimitWarning type="unit" />
      )}

      {/* Statistics */}
      <UnitsStats stats={stats} />

      {/* Filters */}
      <UnitFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        propertyFilter={propertyFilter}
        onPropertyFilterChange={setPropertyFilter}
        properties={properties}
        onReset={() => {
          setSearch("");
          setStatusFilter("all");
          setPropertyFilter("all");
        }}
      />

      {/* Table */}
      <UnitsTable
        units={paginatedUnits}
        properties={properties}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        page={page}
        totalPages={Math.ceil(filteredUnits.length / ITEMS_PER_PAGE)}
        totalUnits={filteredUnits.length}
        onPageChange={setPage}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Create/Edit Dialog */}
      <UnitFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        unit={editingUnit}
        properties={properties}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the unit
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MerchantLayout>
  );
}
