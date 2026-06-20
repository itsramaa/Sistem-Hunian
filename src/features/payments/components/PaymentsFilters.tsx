import { Search } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface PaymentsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  className?: string;
}

export function PaymentsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  className = '',
}: PaymentsFiltersProps) {
  return (
    <div className={`glass-filter-bar flex flex-col sm:flex-row gap-4 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan referensi atau tipe..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-xl bg-background/60 border-border/50"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px] rounded-xl bg-background/60 border-border/50">
          <SelectValue placeholder="Filter status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="pending">Menunggu</SelectItem>
          <SelectItem value="paid">Lunas</SelectItem>
          <SelectItem value="overdue">Terlambat</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
