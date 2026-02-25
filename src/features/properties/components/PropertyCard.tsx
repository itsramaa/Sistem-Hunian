import { useNavigate } from 'react-router-dom';
import { Property } from '@/features/properties/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Building2, Copy, DoorOpen, Edit, Image as ImageIcon, MapPin, MoreHorizontal, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { formatLabel } from '@/shared/utils/utils';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onManageUnits: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  onDuplicate?: (property: Property) => void;
  isDeleting?: boolean;
  style?: React.CSSProperties;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
};

function getOccupancySegments(rate: number) {
  const filled = Math.round(rate / 25);
  return Array.from({ length: 4 }, (_, i) => i < filled);
}

function getOccupancyColor(rate: number): string {
  if (rate >= 80) return 'bg-success';
  if (rate >= 50) return 'bg-warning';
  return 'bg-destructive';
}

function isNewProperty(createdAt: string): boolean {
  const created = new Date(createdAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return created > sevenDaysAgo;
}

export function PropertyCard({ 
  property, 
  onEdit, 
  onDelete, 
  onManageUnits, 
  onManagePhotos,
  onDuplicate,
  isDeleting,
  style,
}: PropertyCardProps) {
  const navigate = useNavigate();
  const occupancyRate = property.total_units > 0 ? (property.occupied_units / property.total_units) * 100 : 0;
  const isNew = isNewProperty(property.created_at);
  const segments = getOccupancySegments(occupancyRate);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menuitem"]') || target.closest('[data-radix-popper-content-wrapper]')) return;
    navigate(`/merchant/properties/${property.id}`);
  };

  return (
    <div 
      className="group bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl shadow-sm hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden"
      style={style}
      onClick={handleCardClick}
    >
      {/* Image section */}
      {property.images && property.images.length > 0 ? (
        <div className="relative h-32 overflow-hidden">
          <img 
            src={property.images[0]} 
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {property.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
              +{property.images.length - 1}
            </div>
          )}
          {isNew && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] px-1.5 py-0 h-5 rounded-full">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />Baru
            </Badge>
          )}
        </div>
      ) : (
        <div className="relative h-32 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 flex items-center justify-center">
          <Building2 className="h-10 w-10 text-muted-foreground/30" />
          {isNew && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] px-1.5 py-0 h-5 rounded-full">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />Baru
            </Badge>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="gradient-icon-box w-9 h-9 shrink-0">
              <Building2 className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{property.name}</h3>
                <p className="text-xs text-muted-foreground">{formatLabel(property.property_type)}</p>
              </div>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="hidden group-hover:flex items-center gap-0.5 mr-0.5">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(property)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onManageUnits(property)}>
                      <DoorOpen className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Kelola Unit</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onManagePhotos(property)}>
                      <ImageIcon className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Foto</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onManageUnits(property)}>
                  <DoorOpen className="h-4 w-4 mr-2" />Kelola Unit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManagePhotos(property)}>
                  <ImageIcon className="h-4 w-4 mr-2" />Kelola Foto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(property)}>
                  <Edit className="h-4 w-4 mr-2" />Edit
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(property)}>
                    <Copy className="h-4 w-4 mr-2" />Duplikat
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(property)} className="text-destructive" disabled={isDeleting}>
                  {isDeleting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  {isDeleting ? 'Memeriksa...' : 'Hapus'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{property.city}, {property.province}</span>
        </div>

        {/* Amenity Badges */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-[10px] py-0 px-1.5 rounded-full bg-muted/60">
                {amenity.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 rounded-full">
                +{property.amenities.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Occupancy + Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Hunian</p>
            <p className="font-semibold text-sm">{property.occupied_units}/{property.total_units} unit</p>
          </div>
          <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[property.status || 'active']}`}>
            {formatLabel(property.status)}
          </Badge>
        </div>

        {/* Segmented Occupancy Bar */}
        <div className="flex gap-1">
          {segments.map((filled, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                filled ? getOccupancyColor(occupancyRate) : 'bg-muted/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
