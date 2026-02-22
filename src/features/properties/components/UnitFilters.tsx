import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Property } from "../types";

interface UnitFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  propertyFilter: string;
  onPropertyFilterChange: (value: string) => void;
  properties: Property[];
  onReset: () => void;
}

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'available', label: 'Tersedia' },
  { value: 'occupied', label: 'Terisi' },
  { value: 'maintenance', label: 'Perbaikan' },
  { value: 'reserved', label: 'Dipesan' },
];

export const UnitFilters = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  propertyFilter,
  onPropertyFilterChange,
  properties,
  onReset,
}: UnitFiltersProps) => {
  const hasActiveFilters = search || statusFilter !== 'all' || propertyFilter !== 'all';
  const activeFilterCount = [search, statusFilter !== 'all', propertyFilter !== 'all'].filter(Boolean).length;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari unit atau properti..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={propertyFilter} onValueChange={onPropertyFilterChange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter Properti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Properti</SelectItem>
            {properties.map(property => (
              <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filter aktif:</span>
          {search && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Cari: "{search}"
              <button onClick={() => onSearchChange('')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs capitalize">
              {statusOptions.find(s => s.value === statusFilter)?.label}
              <button onClick={() => onStatusFilterChange('all')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {propertyFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {properties.find(p => p.id === propertyFilter)?.name}
              <button onClick={() => onPropertyFilterChange('all')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onReset} className="h-6 text-xs px-2">
            <X className="h-3 w-3 mr-1" />Reset semua
          </Button>
        </div>
      )}
    </div>
  );
};
