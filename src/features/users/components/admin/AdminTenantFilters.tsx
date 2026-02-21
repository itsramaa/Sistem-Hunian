
import { Property } from "@/features/properties/types";
import { Merchant } from "@/features/users/types/admin-merchant";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/utils";
import { Search, X } from "lucide-react";

interface AdminTenantFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  merchantFilter: string;
  onMerchantFilterChange: (value: string) => void;
  propertyFilter: string;
  onPropertyFilterChange: (value: string) => void;
  minRent: string;
  onMinRentChange: (value: string) => void;
  maxRent: string;
  onMaxRentChange: (value: string) => void;
  merchants: Merchant[];
  properties: Property[];
  onResetFilters: () => void;
  className?: string;
}

export function AdminTenantFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  merchantFilter,
  onMerchantFilterChange,
  propertyFilter,
  onPropertyFilterChange,
  minRent,
  onMinRentChange,
  maxRent,
  onMaxRentChange,
  merchants,
  properties,
  onResetFilters,
  className,
}: AdminTenantFiltersProps) {
  const hasActiveFilters = searchQuery || statusFilter !== "all" || merchantFilter !== "all" || propertyFilter !== "all" || minRent || maxRent;

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants by name or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onResetFilters} className="px-3">
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_signature">Pending</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
            <SelectItem value="evicted">Evicted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={merchantFilter} onValueChange={onMerchantFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Merchant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Merchants</SelectItem>
            {merchants.map((merchant) => (
              <SelectItem key={merchant.id} value={merchant.id}>
                {merchant.business_name || merchant.profiles?.full_name || "Unknown Merchant"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={propertyFilter} onValueChange={onPropertyFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min Rent"
            value={minRent || ''}
            onChange={(e) => onMinRentChange(e.target.value)}
            className="w-full"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max Rent"
            value={maxRent || ''}
            onChange={(e) => onMaxRentChange(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
