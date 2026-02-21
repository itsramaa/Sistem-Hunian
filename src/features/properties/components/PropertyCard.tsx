import { Property } from '@/features/properties/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Progress } from '@/shared/components/ui/progress';
import { Building2, DoorOpen, Edit, Image as ImageIcon, MapPin, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onManageUnits: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  isDeleting?: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
};

export function PropertyCard({ 
  property, 
  onEdit, 
  onDelete, 
  onManageUnits, 
  onManagePhotos,
  isDeleting 
}: PropertyCardProps) {
  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{property.name}</CardTitle>
              <CardDescription className="capitalize">{property.property_type}</CardDescription>
            </div>
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
      </CardHeader>
      <CardContent className="space-y-3">
        {property.images && property.images.length > 0 && (
          <div className="relative h-24 rounded-lg overflow-hidden bg-muted">
            <img 
              src={property.images[0]} 
              alt={property.name}
              className="w-full h-full object-cover"
            />
            {property.images.length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                +{property.images.length - 1}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{property.city}, {property.province}</span>
        </div>
        {/* Amenity Badges */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 4).map((amenity) => {
              // Format amenity: replace underscores with spaces and capitalize
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
        <Progress 
          value={property.total_units > 0 ? (property.occupied_units / property.total_units) * 100 : 0} 
          className="h-2" 
        />
      </CardContent>
    </Card>
  );
}
