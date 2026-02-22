import { Property } from '@/features/properties/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Progress } from '@/shared/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Building2, DoorOpen, Edit, Image as ImageIcon, MapPin, MoreHorizontal, RefreshCw, Sparkles, Trash2 } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onManageUnits: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  isDeleting?: boolean;
  style?: React.CSSProperties;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
};

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
  isDeleting,
  style,
}: PropertyCardProps) {
  const occupancyRate = property.total_units > 0 ? (property.occupied_units / property.total_units) * 100 : 0;
  const isNew = isNewProperty(property.created_at);

  return (
    <Card 
      className="group hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
      style={style}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-base">{property.name}</CardTitle>
                {isNew && (
                  <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0 h-4">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    Baru
                  </Badge>
                )}
              </div>
              <CardDescription className="capitalize">{property.property_type}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Quick actions on hover */}
            <div className="hidden group-hover:flex items-center gap-0.5 mr-1">
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
                  <TooltipContent>Manage Units</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onManagePhotos(property)}>
                      <ImageIcon className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Photos</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onManageUnits(property)}>
                  <DoorOpen className="h-4 w-4 mr-2" />
                  Manage Units
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManagePhotos(property)}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Manage Photos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(property)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(property)}
                  className="text-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {isDeleting ? 'Checking...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Image or placeholder */}
        {property.images && property.images.length > 0 ? (
          <div className="relative h-24 rounded-lg overflow-hidden bg-muted">
            <img 
              src={property.images[0]} 
              alt={property.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {property.images.length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                +{property.images.length - 1}
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-24 rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{property.city}, {property.province}</span>
        </div>

        {/* Amenity Badges */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 4).map((amenity) => {
              const amenityLabel = amenity.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <Badge key={amenity} variant="secondary" className="text-xs py-0">
                  {amenityLabel}
                </Badge>
              );
            })}
            {property.amenities.length > 4 && (
              <Badge variant="outline" className="text-xs py-0">
                +{property.amenities.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Occupancy</p>
            <p className="font-medium">{property.occupied_units}/{property.total_units} units</p>
          </div>
          <Badge variant="outline" className={statusColors[property.status]}>
            {property.status}
          </Badge>
        </div>

        {/* Color-coded occupancy bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(occupancyRate)}`}
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
