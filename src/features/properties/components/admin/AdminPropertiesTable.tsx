import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/utils/utils";
import { AlertTriangle, CheckCircle, Eye, MapPin, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { AdminProperty } from "../../types/admin";

interface AdminPropertiesTableProps {
  properties: AdminProperty[];
  onStatusChange: (id: string, status: AdminProperty["status"]) => void;
}

export function AdminPropertiesTable({ properties, onStatusChange }: AdminPropertiesTableProps) {
  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      active: "bg-success/10 text-success border-success/20",
      inactive: "bg-muted text-muted-foreground",
      maintenance: "bg-warning/10 text-warning border-warning/20",
    };
    return (
      <Badge 
        variant="outline" 
        className={cn("capitalize", statusStyles[status] || statusStyles.inactive)}
      >
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeStyles: Record<string, string> = {
      kost: "border-blue-200 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
      apartment: "border-purple-200 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
    };
    return (
      <Badge 
        variant="outline" 
        className={cn("capitalize", typeStyles[type] || "")}
      >
        {type}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property Name</TableHead>
            <TableHead className="hidden md:table-cell">Merchant</TableHead>
            <TableHead className="hidden lg:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="hidden sm:table-cell">Occupancy</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No properties found matching your filters.
              </TableCell>
            </TableRow>
          ) : (
            properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{property.name}</span>
                    <span className="text-xs text-muted-foreground md:hidden capitalize">
                      {property.type} • {property.city}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{property.merchantName}</TableCell>
                <TableCell className="hidden lg:table-cell">{getTypeBadge(property.type)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {property.city}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{property.occupiedUnits}/{property.totalUnits}</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((property.occupiedUnits / property.totalUnits) * 100)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(property.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => toast.info(`Viewing details for ${property.name}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onStatusChange(property.id, "active")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(property.id, "maintenance")}>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Mark Maintenance
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
