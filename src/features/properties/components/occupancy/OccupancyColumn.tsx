import { OccupancyUnit, OccupancyColumn as ColumnType } from '../../hooks/useOccupancyBoard';
import { OccupancyCard } from './OccupancyCard';
import { useState } from 'react';

interface Props {
  title: string;
  columnKey: ColumnType;
  units: OccupancyUnit[];
  count: number;
  color: string;
  onDrop: (unitId: string, targetColumn: ColumnType) => void;
  readOnly?: boolean;
}

export function OccupancyColumn({ title, columnKey, units, count, color, onDrop, readOnly }: Props) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border/50 bg-muted/30 min-h-[300px] transition-colors ${dragOver && !readOnly ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
      onDragOver={(e) => { if (!readOnly) { e.preventDefault(); setDragOver(true); } }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (readOnly) return;
        const unitId = e.dataTransfer.getData('unit-id');
        if (unitId) onDrop(unitId, columnKey);
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
        {units.map(u => <OccupancyCard key={u.id} unit={u} />)}
        {!units.length && (
          <p className="text-xs text-muted-foreground text-center py-6">Tidak ada unit</p>
        )}
      </div>
    </div>
  );
}
