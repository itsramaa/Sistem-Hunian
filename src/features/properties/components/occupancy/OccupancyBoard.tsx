import { useState, useMemo } from 'react';
import { useOccupancyBoard, OccupancyColumn as ColumnType } from '../../hooks/useOccupancyBoard';
import { OccupancyColumn } from './OccupancyColumn';
import { OccupancyFilters } from './OccupancyFilters';
import { OccupancyStats } from './OccupancyStats';
import { unitService } from '../../services/unitService';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';

const columns: { key: ColumnType; title: string; color: string; readOnly?: boolean }[] = [
  { key: 'occupied', title: 'Terisi', color: 'bg-emerald-500' },
  { key: 'available', title: 'Kosong - Tersedia', color: 'bg-blue-500' },
  { key: 'maintenance', title: 'Kosong - Maintenance', color: 'bg-amber-500' },
  { key: 'notice', title: 'Notice Diterima', color: 'bg-purple-500', readOnly: true },
];

const statusMap: Record<string, string> = {
  occupied: 'occupied',
  available: 'available',
  maintenance: 'maintenance',
};

export function OccupancyBoard() {
  const { data: units = [], isLoading } = useOccupancyBoard();
  const qc = useQueryClient();

  const [filters, setFilters] = useState({ unitType: 'all', floor: 'all', property: 'all', maxPrice: '' });
  const [pendingDrop, setPendingDrop] = useState<{ unitId: string; column: ColumnType } | null>(null);

  const filtered = useMemo(() => units.filter(u => {
    if (filters.unitType !== 'all' && u.unit_type !== filters.unitType) return false;
    if (filters.floor !== 'all' && u.floor !== Number(filters.floor)) return false;
    if (filters.property !== 'all' && u.property_id !== filters.property) return false;
    if (filters.maxPrice && u.rent_amount > Number(filters.maxPrice)) return false;
    return true;
  }), [units, filters]);

  const grouped = useMemo(() => ({
    occupied: filtered.filter(u => u.status === 'occupied'),
    available: filtered.filter(u => u.status === 'available'),
    maintenance: filtered.filter(u => u.status === 'maintenance'),
    notice: filtered.filter(u => u.status === 'notice'),
  }), [filtered]);

  const unitTypes = [...new Set(units.map(u => u.unit_type).filter(Boolean) as string[])];
  const floors = [...new Set(units.map(u => u.floor).filter(f => f != null) as number[])].sort((a, b) => a - b);
  const properties = [...new Map(units.map(u => [u.property_id, { id: u.property_id, name: u.property_name }])).values()];

  const handleDrop = (unitId: string, column: ColumnType) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit || unit.status === column) return;
    setPendingDrop({ unitId, column });
  };

  const confirmDrop = async () => {
    if (!pendingDrop) return;
    const newStatus = statusMap[pendingDrop.column];
    if (!newStatus) return;
    try {
      await unitService.updateUnit(pendingDrop.unitId, { status: newStatus } as any);
      qc.invalidateQueries({ queryKey: ['occupancy-board'] });
      toast.success('Status unit diperbarui');
    } catch (e: any) {
      toast.error(e.message || 'Gagal memperbarui status');
    }
    setPendingDrop(null);
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Memuat papan okupansi...</div>;

  return (
    <div className="space-y-4">
      <OccupancyStats
        total={filtered.length}
        occupied={grouped.occupied.length}
        available={grouped.available.length}
        maintenance={grouped.maintenance.length}
        notice={grouped.notice.length}
      />

      <OccupancyFilters unitTypes={unitTypes} floors={floors} properties={properties} filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(col => (
          <OccupancyColumn
            key={col.key}
            title={col.title}
            columnKey={col.key}
            units={grouped[col.key]}
            count={grouped[col.key].length}
            color={col.color}
            onDrop={handleDrop}
            readOnly={col.readOnly}
          />
        ))}
      </div>

      <AlertDialog open={!!pendingDrop} onOpenChange={() => setPendingDrop(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
            <AlertDialogDescription>
              Pindahkan unit ke kolom "{columns.find(c => c.key === pendingDrop?.column)?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={confirmDrop}>Konfirmasi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
