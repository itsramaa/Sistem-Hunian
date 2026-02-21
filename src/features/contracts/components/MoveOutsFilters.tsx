
import { Input } from '@/shared/components/ui/input';
import { Search } from 'lucide-react';

interface MoveOutsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function MoveOutsFilters({
  searchTerm,
  onSearchChange,
  className = '',
}: MoveOutsFiltersProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by tenant or unit..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
