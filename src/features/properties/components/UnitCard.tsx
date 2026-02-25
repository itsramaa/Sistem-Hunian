import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { formatCurrency } from '@/shared/utils/currency';
import { Building2, DoorOpen, Edit, Eye, MoreHorizontal, Ruler, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Unit, Property } from '../types';
import { statusColors } from '../utils/unit-utils';
import { cn, formatLabel } from '@/shared/utils/utils';

interface UnitCardProps {
  unit: Unit;
  properties: Property[];
  onEdit: (unit: Unit) => void;
  onDelete: (id: string) => void;
  style?: React.CSSProperties;
}

const statusLabels: Record<string, string> = {
  available: 'Tersedia',
  occupied: 'Terisi',
  maintenance: 'Perbaikan',
  reserved: 'Dipesan',
};

export function UnitCard({ unit, properties, onEdit, onDelete, style }: UnitCardProps) {
  const navigate = useNavigate();
  const propertyName = properties.find(p => p.id === unit.property_id)?.name || 'Tidak diketahui';

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menuitem"]') || target.closest('[data-radix-popper-content-wrapper]')) return;
    navigate(`/merchant/units/${unit.id}`);
  };

  return (
    <div
      className="group bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl shadow-sm hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden"
      style={style}
      onClick={handleCardClick}
      role="article"
      aria-label={`Unit ${unit.unit_number} di ${propertyName}`}
    >
      {/* Photo / Placeholder */}
      {unit.photos && unit.photos.length > 0 ? (
        <div className="relative h-32 overflow-hidden">
          <img
            src={unit.photos[0]}
            alt={`Foto Unit ${unit.unit_number}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {unit.photos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
              +{unit.photos.length - 1} foto
            </div>
          )}
          <Badge variant="outline" className={cn('absolute top-2 left-2 rounded-full text-[10px] backdrop-blur-sm', statusColors[unit.status])}>
            {statusLabels[unit.status] || unit.status}
          </Badge>
        </div>
      ) : (
        <div className="relative h-32 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 flex items-center justify-center">
          <DoorOpen className="h-10 w-10 text-muted-foreground/30" aria-hidden="true" />
          <Badge variant="outline" className={cn('absolute top-2 left-2 rounded-full text-[10px]', statusColors[unit.status])}>
            {statusLabels[unit.status] || unit.status}
          </Badge>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="gradient-icon-box w-9 h-9 shrink-0" aria-hidden="true">
              <DoorOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">Unit {unit.unit_number}</h3>
            <p className="text-xs text-muted-foreground">{formatLabel(unit.unit_type) || '—'}</p>
          </div>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="hidden group-hover:flex items-center gap-0.5 mr-0.5">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(unit)} aria-label="Edit Unit">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Opsi lainnya">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={() => navigate(`/merchant/units/${unit.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />Lihat Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(unit)}>
                  <Edit className="h-4 w-4 mr-2" />Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(unit.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Property */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{propertyName}</span>
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Sewa / bulan</p>
            <p className="font-semibold text-sm">{formatCurrency(unit.rent_amount)}</p>
          </div>
          {unit.size_sqm && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Ruler className="h-3 w-3" aria-hidden="true" />
              <span>{unit.size_sqm} m²</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
