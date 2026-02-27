import { OccupancyUnit } from '../../hooks/useOccupancyBoard';
import { Badge } from '@/shared/components/ui/badge';
import { Calendar, Wrench, User } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const typeColors: Record<string, string> = {
  single: 'bg-blue-500',
  double: 'bg-emerald-500',
  studio: 'bg-orange-500',
  suite: 'bg-purple-500',
};

interface Props {
  unit: OccupancyUnit;
}

export function OccupancyCard({ unit }: Props) {
  const stripe = typeColors[unit.unit_type || ''] || 'bg-muted-foreground/40';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('unit-id', unit.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="bg-card border border-border/50 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <div className={`w-1 h-full min-h-[3rem] rounded-full ${stripe}`} />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm truncate">Unit {unit.unit_number}</span>
            {unit.maintenance_count > 0 && (
              <Badge variant="outline" className="text-xs rounded-lg border-amber-500/50 text-amber-600">
                <Wrench className="h-3 w-3 mr-0.5" />{unit.maintenance_count}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{unit.property_name}</p>
          {unit.tenant_name && (
            <p className="text-xs flex items-center gap-1"><User className="h-3 w-3" />{unit.tenant_name}</p>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Rp {unit.rent_amount?.toLocaleString('id-ID')}</span>
            {unit.contract_end_date && (
              <span className="text-muted-foreground flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                {format(new Date(unit.contract_end_date), 'dd MMM yy', { locale: id })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
