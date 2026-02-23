import { useAuth } from "@/features/auth/hooks/useAuth";
import { UnitCard } from "@/features/properties/components/UnitCard";
import { UnitFilters } from "@/features/properties/components/UnitFilters";
import { UnitFormDialog } from "@/features/properties/components/UnitFormDialog";
import { UnitsStats } from "@/features/properties/components/UnitsStats";
import { UnitsTable } from "@/features/properties/components/UnitsTable";
import { useMerchantProperties } from "@/features/properties/hooks/useMerchantProperties";
import { useMerchantUnits } from "@/features/properties/hooks/useMerchantUnits";
import { Unit, UnitFormData } from "@/features/properties/types";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ChevronLeft, ChevronRight, DoorOpen, LayoutGrid, List, Plus, CalendarClock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function MerchantUnits() {
  const { merchant } = useAuth();
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, propertyFilter]);

  const { properties, loading: propertiesLoading } = useMerchantProperties(merchant?.id || '');
  const { units, loading: unitsLoading, createUnit, updateUnit, deleteUnit, isCreating, isUpdating, isDeleting } = useMerchantUnits(merchant?.id || '');

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

  const totalPages = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE);

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

  const handleCreate = () => { setEditingUnit(null); setIsDialogOpen(true); };
  const handleEdit = (unit: Unit) => { setEditingUnit(unit); setIsDialogOpen(true); };
  const handleDeleteClick = (id: string) => { setDeleteId(id); };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try { await deleteUnit(deleteId); setDeleteId(null); } catch {}
  };

  const handleFormSubmit = async (data: UnitFormData) => {
    try {
      const payload = { ...data, amenities: [], property_id: data.property_id || editingUnit?.property_id || '' };
      if (editingUnit) { await updateUnit({ id: editingUnit.id, payload }); }
      else { await createUnit(payload as any); }
      setIsDialogOpen(false);
    } catch {}
  };

  return (
    <>
      <PageHeader icon={DoorOpen} title="Unit Saya" description="Kelola semua unit di properti Anda">
        <Button disabled={properties.length === 0} onClick={handleCreate} className="gap-2 gradient-cta text-primary-foreground hover:opacity-90 rounded-xl">
          <Plus className="h-4 w-4" />Tambah Unit
        </Button>
      </PageHeader>
      <div className="mb-6" />

      <UnitsStats stats={stats} />

      {/* Filters with View Toggle */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1">
          <UnitFilters
            search={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            propertyFilter={propertyFilter} onPropertyFilterChange={setPropertyFilter} properties={properties}
            onReset={() => { setSearch(""); setStatusFilter("all"); setPropertyFilter("all"); }}
          />
        </div>
        <div className="flex items-center bg-muted/60 rounded-xl p-1 gap-0.5 shrink-0 self-start mt-0">
          <Button variant={viewMode === 'gallery' ? 'default' : 'ghost'} size="icon" className={`h-8 w-8 rounded-lg ${viewMode === 'gallery' ? 'bg-primary text-primary-foreground shadow-sm' : ''}`} onClick={() => setViewMode('gallery')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" className={`h-8 w-8 rounded-lg ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : ''}`} onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'gallery' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedUnits.map((unit) => (
              <UnitCard key={unit.id} unit={unit} properties={properties} onEdit={handleEdit} onDelete={handleDeleteClick} />
            ))}
          </div>
          {paginatedUnits.length === 0 && (
            <div className="glass-table">
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="gradient-icon-box w-16 h-16 mb-4"><DoorOpen className="h-8 w-8 text-muted-foreground" /></div>
                <h3 className="font-medium text-lg mb-1">Belum ada unit</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">Tambahkan unit pertama Anda dengan tombol "Tambah Unit" di atas.</p>
              </div>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1 py-2">
              <div className="text-sm text-muted-foreground">Menampilkan {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredUnits.length)} dari {filteredUnits.length} unit</div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1} className="h-8 rounded-full"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">{page}/{totalPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="h-8 rounded-full"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <UnitsTable units={paginatedUnits} properties={properties} onEdit={handleEdit} onDelete={handleDeleteClick} page={page} totalPages={totalPages} totalUnits={filteredUnits.length} onPageChange={setPage} itemsPerPage={ITEMS_PER_PAGE} />
      )}

      <UnitFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} unit={editingUnit} properties={properties} onSubmit={handleFormSubmit} isLoading={isCreating || isUpdating} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl bg-card/95 backdrop-blur-xl border border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Unit?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Unit dan semua data terkait akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl" disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
