import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { Search } from "lucide-react";
import { DateRange } from "react-day-picker";

interface AdminReferralFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

export function AdminReferralFilters({
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  statusFilter,
  setStatusFilter,
}: AdminReferralFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by code or referrer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
