import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';

interface TenantsFiltersProps {
  activeTab: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  className?: string;
}

export function TenantsFilters({ activeTab, searchQuery, onSearchChange, statusFilter, onStatusFilterChange, className = '' }: TenantsFiltersProps) {
  return (
    <div className={`glass-filter-bar ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'invitations' ? "Cari email, properti, atau unit..." : "Cari nama, email, properti, atau unit..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 rounded-xl bg-background/60 border-border/50"
          />
        </div>
        {activeTab === 'invitations' && (
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl bg-background/60">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="accepted">Diterima</SelectItem>
              <SelectItem value="expired">Kedaluwarsa</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
