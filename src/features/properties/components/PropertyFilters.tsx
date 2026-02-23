import { PROPERTY_TYPES } from '@/features/properties/constants';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ArrowUpDown, Grid, List, RotateCcw, Search, X } from 'lucide-react';

export type SortOption = 'name-asc' | 'name-desc' | 'occupancy-high' | 'occupancy-low' | 'newest' | 'oldest';

interface PropertyFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: SortOption;
  onSortByChange: (value: SortOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  className?: string;
}

const filterTypes = [
  { value: 'all', label: 'All Types' },
  ...PROPERTY_TYPES
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'occupancy-high', label: 'Occupancy High' },
  { value: 'occupancy-low', label: 'Occupancy Low' },
];

export function PropertyFilters({
  searchTerm, onSearchChange, typeFilter, onTypeFilterChange,
  statusFilter, onStatusFilterChange, sortBy, onSortByChange,
  viewMode, onViewModeChange, onResetFilters, activeFilterCount, className = '',
}: PropertyFiltersProps) {
  return (
    <div className={`glass-filter-bar space-y-3 ${className}`}>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-xl bg-background/60 border-border/50"
          />
        </div>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-full md:w-[160px] rounded-xl bg-background/60"><SelectValue placeholder="Property Type" /></SelectTrigger>
          <SelectContent>
            {filterTypes.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full md:w-[160px] rounded-xl bg-background/60"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortOption)}>
          <SelectTrigger className="w-full md:w-[170px] rounded-xl bg-background/60">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
          </SelectContent>
        </Select>
        {/* Pill View Toggle */}
        <div className="flex gap-0.5 rounded-full p-1 bg-muted/30 shrink-0 border border-border/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className={`h-8 w-8 rounded-full ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : ''}`}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('list')}
            className={`h-8 w-8 rounded-full ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : ''}`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1 rounded-full">
              Type: {filterTypes.find(t => t.value === typeFilter)?.label}
              <button onClick={() => onTypeFilterChange('all')} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1 rounded-full">
              Status: {statusOptions.find(s => s.value === statusFilter)?.label}
              <button onClick={() => onStatusFilterChange('all')} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1 rounded-full">
              Search: "{searchTerm}"
              <button onClick={() => onSearchChange('')} className="ml-1 hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 rounded-full" onClick={onResetFilters}>
            <RotateCcw className="h-3 w-3 mr-1" />Reset All
          </Button>
        </div>
      )}
    </div>
  );
}
