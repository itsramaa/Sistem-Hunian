
import { ActiveTenant, AdminTenant } from "@/features/users/types/tenant";
import { cn } from "@/shared/utils/utils";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/currency";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, UserX } from "lucide-react";

interface AdminTenantsTableProps {
  tenants: ActiveTenant[] | AdminTenant[];
  isLoading?: boolean;
  onViewDetails: (tenant: ActiveTenant) => void;
  onTerminate?: (tenant: ActiveTenant) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalCount?: number;
}

export function AdminTenantsTable({
  tenants, isLoading = false, onViewDetails, onTerminate, page = 1, totalPages = 1, onPageChange, itemsPerPage = 10, totalCount,
}: AdminTenantsTableProps) {
  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      active: "bg-success/10 text-success border-success/20",
      suspended: "bg-destructive/10 text-destructive border-destructive/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      pending_signature: "bg-warning/10 text-warning border-warning/20",
      notice: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      expired: "bg-muted text-muted-foreground",
      evicted: "bg-destructive/10 text-destructive border-destructive/20",
      terminated: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={cn("capitalize rounded-full", statusStyles[status] || statusStyles.expired)}>{status.replace('_', ' ')}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="glass-table h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p>Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-table">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border/40">
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Tenant</TableHead>
                <TableHead className="hidden md:table-cell text-xs uppercase tracking-wider font-semibold">Property & Unit</TableHead>
                <TableHead className="hidden lg:table-cell text-xs uppercase tracking-wider font-semibold">Merchant</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="hidden xl:table-cell text-xs uppercase tracking-wider font-semibold">Dates</TableHead>
                <TableHead className="hidden sm:table-cell text-right text-xs uppercase tracking-wider font-semibold">Rent</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No tenants found.</TableCell></TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{tenant.profile?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{tenant.profile?.email || 'No Email'}</span>
                        <div className="md:hidden text-xs text-muted-foreground mt-1">{tenant.unit?.property?.name} • Unit {tenant.unit?.unit_number}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="font-medium">{tenant.unit?.property?.name || 'Unknown Property'}</span>
                        <span className="text-xs text-muted-foreground">Unit {tenant.unit?.unit_number || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="font-medium">{(tenant as AdminTenant).merchant_profile?.full_name || 'Unknown Merchant'}</span>
                        <span className="text-xs text-muted-foreground">{(tenant as AdminTenant).merchant_profile?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span>Start: {tenant.start_date ? format(new Date(tenant.start_date), 'MMM d, yyyy') : '-'}</span>
                        <span>End: {tenant.end_date ? format(new Date(tenant.end_date), 'MMM d, yyyy') : '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right font-medium">{formatCurrency(tenant.rent_amount)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 rounded-xl"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onViewDetails(tenant)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                          {onTerminate && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => onTerminate(tenant)} className="text-destructive focus:text-destructive"><UserX className="mr-2 h-4 w-4" />Terminate Lease</DropdownMenuItem></>)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {(totalPages > 1 || (totalCount && itemsPerPage)) && onPageChange && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            {totalCount ? (<>Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalCount)} of {totalCount} tenants</>) : (<>Page {page} of {totalPages}</>)}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="rounded-xl"><ChevronLeft className="h-4 w-4" />Previous</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="rounded-xl">Next<ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
