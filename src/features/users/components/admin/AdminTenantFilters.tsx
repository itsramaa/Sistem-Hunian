
import { Property } from "@/features/properties/types";
import { Merchant } from "@/features/users/types/admin-merchant";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/utils";
import { Search, X } from "lucide-react";

interface AdminTenantFiltersProps {
  searchQuery: string; onSearchChange: (value: string) => void;
  statusFilter: string; onStatusFilterChange: (value: string) => void;
  merchantFilter: string; onMerchantFilterChange: (value: string) => void;
  propertyFilter: string; onPropertyFilterChange: (value: string) => void;
  minRent: string; onMinRentChange: (value: string) => void;
  maxRent: string; onMaxRentChange: (value: string) => void;
  merchants: Merchant[]; properties: Property[];
  onResetFilters: () => void; className?: string;
}

export function AdminTenantFilters({
  searchQuery, onSearchChange, statusFilter, onStatusFilterChange, merchantFilter, onMerchantFilterChange,
  propertyFilter, onPropertyFilterChange, minRent, onMinRentChange, maxRent, onMaxRentChange,
  merchants, properties, onResetFilters, className,
}: AdminTenantFiltersProps) {
  const hasActiveFilters = searchQuery || statusFilter !== "all" || merchantFilter !== "all" || propertyFilter !== "all" || minRent || maxRent;

  return (
    <div className={cn("glass-filter-bar", className)}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tenants by name or email..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10 rounded-xl bg-background/60 border-border/50" />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onResetFilters} className="px-3 rounded-full"><X className="mr-2 h-4 w-4" />Reset</Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="rounded-xl bg-background/60 border-border/50"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_signature">Pending</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
            <SelectItem value="evicted">Evicted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={merchantFilter} onValueChange={onMerchantFilterChange}>
          <SelectTrigger className="rounded-xl bg-background/60 border-border/50"><SelectValue placeholder="Merchant" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Merchants</SelectItem>
            {merchants.map((m) => (<SelectItem key={m.id} value={m.id}>{m.business_name || m.profiles?.full_name || "Unknown"}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={propertyFilter} onValueChange={onPropertyFilterChange}>
          <SelectTrigger className="rounded-xl bg-background/60 border-border/50"><SelectValue placeholder="Property" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="Min Rent" value={minRent || ''} onChange={(e) => onMinRentChange(e.target.value)} className="w-full rounded-xl bg-background/60 border-border/50" />
          <span className="text-muted-foreground">-</span>
          <Input type="number" placeholder="Max Rent" value={maxRent || ''} onChange={(e) => onMaxRentChange(e.target.value)} className="w-full rounded-xl bg-background/60 border-border/50" />
        </div>
      </div>
    </div>
  );
}
