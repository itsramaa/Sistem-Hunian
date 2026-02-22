import { Property } from '@/features/properties/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Building2, ChevronLeft, ChevronRight, DoorOpen, Edit, Image as ImageIcon, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react';

interface PropertyTableProps {
  properties: Property[];
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onManageUnits: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  deleteLoadingId?: string | null;
  page: number;
  totalPages: number;
  totalProperties: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange?: (value: number) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
};

function getOccupancyColor(rate: number): string {
  if (rate >= 80) return 'text-success';
  if (rate >= 50) return 'text-warning';
  return 'text-destructive';
}

// Generate page numbers for pagination
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('ellipsis');
  if (total > 1) pages.push(total);
  return pages;
}

export function PropertyTable({ 
  properties, 
  onEdit, 
  onDelete, 
  onManageUnits, 
  onManagePhotos,
  deleteLoadingId,
  page,
  totalPages,
  totalProperties,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}: PropertyTableProps) {
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Amenities</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => {
              const occupancyRate = property.total_units > 0 ? (property.occupied_units / property.total_units) * 100 : 0;
              return (
                <TableRow key={property.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      {property.images && property.images.length > 0 ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          <img src={property.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{property.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{property.property_type}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{property.city}, {property.province}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${getOccupancyColor(occupancyRate)}`}>
                        {property.occupied_units}/{property.total_units}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(occupancyRate)}% occupied
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {property.amenities && property.amenities.length > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        {property.amenities.length} amenities
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[property.status]}>
                      {property.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
                          className="text-destructive focus:text-destructive"
                          disabled={deleteLoadingId === property.id}
                        >
                          {deleteLoadingId === property.id ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          {deleteLoadingId === property.id ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {properties.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No properties found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Enhanced Pagination */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalProperties)} of {totalProperties}
            </span>
            {onItemsPerPageChange && (
              <Select value={String(itemsPerPage)} onValueChange={(v) => onItemsPerPageChange(Number(v))}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="18">18</SelectItem>
                  <SelectItem value="27">27</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </Button>
              )
            )}
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
