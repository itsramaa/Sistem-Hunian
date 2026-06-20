import { PROPERTY_TYPES } from '@/features/properties/constants';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
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
  { value: 'all', label: 'Semua Tipe' },
  ...PROPERTY_TYPES
];

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'maintenance', label: 'Perbaikan' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'name-asc', label: 'Nama A-Z' },
  { value: 'name-desc', label: 'Nama Z-A' },
  { value: 'occupancy-high', label: 'Hunian Tertinggi' },
  { value: 'occupancy-low', label: 'Hunian Terendah' },
];

export function PropertyFilters({
  searchTerm, onSearchChange, typeFilter, onTypeFilterChange,
  statusFilter, onStatusFilterChange, sortBy, onSortByChange,
  viewMode, onViewModeChange, onResetFilters, activeFilterCount, className = '',
}: PropertyFiltersProps) {
  return (
    <div className={`glass-filter-bar space-y-3 ${className}`} role="search" aria-label="Filter Properti">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Cari properti..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-xl bg-background/60 border-border/50"
            aria-label="Cari berdasarkan nama atau alamat"
          />
        </div>
        <div className="w-full md:w-[160px]">
          <Label htmlFor="type-filter" className="sr-only">Filter Tipe</Label>
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger id="type-filter" className="w-full rounded-xl bg-background/60"><SelectValue placeholder="Tipe Properti" /></SelectTrigger>
            <SelectContent>
              {filterTypes.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-[160px]">
          <Label htmlFor="status-filter" className="sr-only">Filter Status</Label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger id="status-filter" className="w-full rounded-xl bg-background/60"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-[170px]">
          <Label htmlFor="sort-by" className="sr-only">Urutkan Berdasarkan</Label>
          <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortOption)}>
            <SelectTrigger id="sort-by" className="w-full rounded-xl bg-background/60">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <SelectValue placeholder="Urutkan" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        {/* Pill View Toggle */}
        <div className="flex gap-0.5 rounded-full p-1 bg-muted/30 shrink-0 border border-border/30" role="group" aria-label="Mode Tampilan">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className={`h-8 w-8 rounded-full ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : ''}`}
            aria-label="Tampilan Grid"
            aria-pressed={viewMode === 'grid'}
          >
            <Grid className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('list')}
            className={`h-8 w-8 rounded-full ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : ''}`}
            aria-label="Tampilan List"
            aria-pressed={viewMode === 'list'}
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap" role="status" aria-live="polite">
          <span className="text-xs text-muted-foreground">Filter aktif:</span>
          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1 rounded-full">
              Tipe: {filterTypes.find(t => t.value === typeFilter)?.label}
              <button onClick={() => onTypeFilterChange('all')} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Hapus filter tipe"><X className="h-3 w-3" aria-hidden="true" /></button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1 rounded-full">
              Status: {statusOptions.find(s => s.value === statusFilter)?.label}
              <button onClick={() => onStatusFilterChange('all')} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Hapus filter status"><X className="h-3 w-3" aria-hidden="true" /></button>
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1 rounded-full">
              Cari: "{searchTerm}"
              <button onClick={() => onSearchChange('')} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Hapus pencarian"><X className="h-3 w-3" aria-hidden="true" /></button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 rounded-full" onClick={onResetFilters}>
            <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />Reset Semua
          </Button>
        </div>
      )}
    </div>
  );
}
