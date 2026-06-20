import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Search } from 'lucide-react';

interface MaintenanceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  className?: string;
}

export function MaintenanceFilters({
  searchTerm,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  className = '',
}: MaintenanceFiltersProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari permintaan..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-xl bg-background/60 border-border/50"
        />
      </div>
      <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px] rounded-xl bg-background/60 border-border/50">
          <SelectValue placeholder="Prioritas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Prioritas</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px] rounded-xl bg-background/60 border-border/50">
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Kategori</SelectItem>
          <SelectItem value="plumbing">Plumbing</SelectItem>
          <SelectItem value="electrical">Electrical</SelectItem>
          <SelectItem value="structural">Structural</SelectItem>
          <SelectItem value="cleaning">Cleaning</SelectItem>
          <SelectItem value="pest_control">Pest Control</SelectItem>
          <SelectItem value="appliance">Appliance</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
