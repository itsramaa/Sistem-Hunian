import { Button } from "@/shared/components/ui/button";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { Input } from "@/shared/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { RotateCcw, Search } from "lucide-react";
import { DateRange } from "react-day-picker";

interface AuditLogFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  actionFilter: string;
  onActionFilterChange: (value: string) => void;
  entityFilter: string;
  onEntityFilterChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onResetFilters: () => void;
}

export function AuditLogFilters({
  searchQuery,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  entityFilter,
  onEntityFilterChange,
  dateRange,
  onDateRangeChange,
  onResetFilters,
}: AuditLogFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by user, ID, or details..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={actionFilter} onValueChange={onActionFilterChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          <SelectItem value="create">Create</SelectItem>
          <SelectItem value="update">Update</SelectItem>
          <SelectItem value="delete">Delete</SelectItem>
          <SelectItem value="login">Login</SelectItem>
          <SelectItem value="logout">Logout</SelectItem>
          <SelectItem value="approve">Approve</SelectItem>
          <SelectItem value="reject">Reject</SelectItem>
          <SelectItem value="export">Export</SelectItem>
        </SelectContent>
      </Select>
      <Select value={entityFilter} onValueChange={onEntityFilterChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by Entity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Entities</SelectItem>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="merchant">Merchant</SelectItem>
          <SelectItem value="vendor">Vendor</SelectItem>
          <SelectItem value="property">Property</SelectItem>
          <SelectItem value="settings">Settings</SelectItem>
        </SelectContent>
      </Select>
      <DateRangePicker
        value={dateRange}
        onChange={onDateRangeChange}
        className="w-full md:w-[260px]"
      />
      <Button variant="ghost" size="icon" onClick={onResetFilters} title="Reset Filters">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
