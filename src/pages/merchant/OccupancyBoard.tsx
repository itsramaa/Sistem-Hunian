import { OccupancyBoard } from '@/features/properties/components/occupancy/OccupancyBoard';
import { LayoutGrid } from 'lucide-react';

export default function OccupancyBoardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><LayoutGrid className="h-6 w-6" /> Papan Okupansi</h1>
        <p className="text-sm text-muted-foreground">Visualisasi status unit secara real-time. Drag & drop untuk mengubah status.</p>
      </div>
      <OccupancyBoard />
    </div>
  );
}
