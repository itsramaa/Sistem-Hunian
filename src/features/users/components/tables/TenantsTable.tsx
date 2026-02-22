import { ActiveTenant, AdminTenant } from "@/features/users/types/tenant";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatCurrency } from "@/shared/utils/currency";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, Trash2, UserX } from "lucide-react";

export type TenantTableMode = "admin" | "merchant";

interface TenantsTableProps {
  tenants: ActiveTenant[] | AdminTenant[];
  mode?: TenantTableMode;
  isLoading?: boolean;
  onViewDetails: (tenant: ActiveTenant) => void;
  onTerminate?: (tenant: ActiveTenant) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalCount?: number;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string | null | undefined): string {
  if (!name) return 'bg-muted text-muted-foreground';
  const colors = [
    'bg-primary/15 text-primary',
    'bg-info/15 text-info',
    'bg-success/15 text-success',
    'bg-warning/15 text-warning',
    'bg-accent/15 text-accent-foreground',
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

export function TenantsTable({
  tenants,
  mode = "merchant",
  isLoading = false,
  onViewDetails,
  onTerminate,
  page = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  totalCount,
}: TenantsTableProps) {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      active: { className: 'bg-success/10 text-success border-success/30', label: 'Active' },
      suspended: { className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Suspended' },
      pending: { className: 'bg-warning/10 text-warning border-warning/30', label: 'Pending' },
      pending_signature: { className: 'bg-warning/10 text-warning border-warning/30', label: 'Pending' },
      notice: { className: 'bg-orange-500/10 text-orange-600 border-orange-500/30', label: 'Notice' },
      expired: { className: 'bg-muted text-muted-foreground border-muted', label: 'Expired' },
      evicted: { className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Evicted' },
      terminated: { className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Terminated' },
    };
    const c = config[status] || { className: '', label: status };
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead className="hidden md:table-cell">Property & Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Rent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell className="hidden sm:table-cell text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead className="hidden md:table-cell">Property & Unit</TableHead>
              {mode === "admin" && <TableHead className="hidden lg:table-cell">Merchant</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="hidden xl:table-cell">Dates</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Rent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={mode === "admin" ? 7 : 6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <UserX className="h-5 w-5" />
                    </div>
                    <p className="text-sm">No active tenants found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onViewDetails(tenant)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(tenant.profile?.full_name)}`}>
                        {getInitials(tenant.profile?.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tenant.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">{tenant.profile?.email || 'No Email'}</p>
                        <div className="md:hidden text-xs text-muted-foreground mt-0.5">
                          {tenant.unit?.property?.name} • Unit {tenant.unit?.unit_number}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <p className="font-medium">{tenant.unit?.property?.name || 'Unknown Property'}</p>
                      <p className="text-xs text-muted-foreground">Unit {tenant.unit?.unit_number || 'N/A'}</p>
                    </div>
                  </TableCell>
                  {mode === "admin" && (
                    <TableCell className="hidden lg:table-cell">
                      <div>
                        <p className="font-medium">{(tenant as AdminTenant).merchant_profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{(tenant as AdminTenant).merchant_profile?.email}</p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex flex-col text-xs text-muted-foreground">
                      <span>{tenant.start_date ? format(new Date(tenant.start_date), 'MMM d, yyyy') : '-'}</span>
                      <span className="text-muted-foreground/60">to {tenant.end_date ? format(new Date(tenant.end_date), 'MMM d, yyyy') : '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right font-medium">
                    {formatCurrency(tenant.rent_amount)}
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onViewDetails(tenant)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {onTerminate && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onTerminate(tenant)}
                              className="text-destructive focus:text-destructive"
                            >
                              {mode === 'admin' ? (
                                <><UserX className="mr-2 h-4 w-4" />Terminate Lease</>
                              ) : (
                                <><Trash2 className="mr-2 h-4 w-4" />Remove Tenant</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {(totalPages > 1 || (totalCount && itemsPerPage)) && onPageChange && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            {totalCount ? (
              <>Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalCount)} of {totalCount}</>
            ) : (
              <>Page {page} of {totalPages}</>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
              Next<ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
