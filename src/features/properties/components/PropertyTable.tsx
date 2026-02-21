import { Property } from '@/features/properties/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
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
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
};

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
  itemsPerPage
}: PropertyTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{property.property_type}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{property.city}, {property.province}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                     <span className="text-sm font-medium">{property.occupied_units}/{property.total_units}</span>
                     <span className="text-xs text-muted-foreground">Occupied</span>
                  </div>
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
            ))}
            {properties.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No properties found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalProperties)} of {totalProperties} properties
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
