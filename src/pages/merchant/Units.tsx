import { useAuth } from "@/features/auth/hooks/useAuth";
import { UnitFilters } from "@/features/properties/components/UnitFilters";
import { UnitFormDialog } from "@/features/properties/components/UnitFormDialog";
import { UnitsStats } from "@/features/properties/components/UnitsStats";
import { UnitsTable } from "@/features/properties/components/UnitsTable";
import { useMerchantProperties } from "@/features/properties/hooks/useMerchantProperties";
import { useMerchantUnits } from "@/features/properties/hooks/useMerchantUnits";
import { Unit, UnitFormData } from "@/features/properties/types";

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
import { DoorOpen, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

export default function MerchantUnits() {
  const { merchant } = useAuth();
  
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

  const stats = useMemo(() => {
    const occupiedUnits = units.filter(u => u.status === 'occupied').length;
    const totalUnits = units.length;
    return {
      totalUnits,
      occupiedUnits,
      availableUnits: units.filter(u => u.status === 'available').length,
      maintenanceUnits: units.filter(u => u.status === 'maintenance').length,
      totalMonthlyRent: units.filter(u => u.status === 'occupied').reduce((sum, u) => sum + u.rent_amount, 0),
      occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
    };
  }, [units]);

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
      const payload = {
        ...data,
        amenities: [],
        property_id: data.property_id || editingUnit?.property_id || '',
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
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="gradient-icon-box w-11 h-11">
            <DoorOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Unit Saya</h1>
            <p className="text-sm text-muted-foreground">Kelola semua unit di properti Anda</p>
          </div>
        </div>
        <Button 
          disabled={properties.length === 0}
          onClick={handleCreate}
          className="gap-2 gradient-cta text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Tambah Unit
        </Button>
      </div>

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
            <AlertDialogTitle>Hapus Unit?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Unit dan semua data terkait akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
