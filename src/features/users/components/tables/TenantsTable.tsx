import { ActiveTenant, AdminTenant } from "@/features/users/types/tenant";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
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
  const colors = ['bg-primary/15 text-primary', 'bg-info/15 text-info', 'bg-success/15 text-success', 'bg-warning/15 text-warning', 'bg-accent/15 text-accent-foreground'];
  return colors[name.charCodeAt(0) % colors.length];
}

export function TenantsTable({ tenants, mode = "merchant", isLoading = false, onViewDetails, onTerminate, page = 1, totalPages = 1, onPageChange, itemsPerPage = 10, totalCount }: TenantsTableProps) {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      active: { className: 'bg-success/10 text-success border-success/30', label: 'Aktif' },
      linked: { className: 'bg-info/10 text-info border-info/30', label: 'Terhubung' },
      suspended: { className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Ditangguhkan' },
      pending: { className: 'bg-warning/10 text-warning border-warning/30', label: 'Menunggu' },
      pending_signature: { className: 'bg-warning/10 text-warning border-warning/30', label: 'Menunggu Tanda Tangan' },
      notice: { className: 'bg-orange-500/10 text-orange-600 border-orange-500/30', label: 'Pemberitahuan' },
      expired: { className: 'bg-muted text-muted-foreground border-muted', label: 'Kedaluwarsa' },
      evicted: { className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Diusir' },
      terminated: { className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Diakhiri' },
    };
    const c = config[status] || { className: '', label: status };
    return <Badge variant="outline" className={`rounded-full ${c.className}`}>{c.label}</Badge>;
  };

  const getPropertyDisplay = (tenant: ActiveTenant) => {
    if (tenant.status === 'linked' && !tenant.unit) return { property: 'Belum ada unit', unit: 'Buat kontrak untuk menetapkan unit' };
    return { property: tenant.unit?.property?.name || '—', unit: tenant.unit?.unit_number ? `Unit ${tenant.unit.unit_number}` : '—' };
  };

  const getRentDisplay = (tenant: ActiveTenant) => {
    if (tenant.status === 'linked' && tenant.rent_amount === 0) return '—';
    return formatCurrency(tenant.rent_amount);
  };

  const getDateDisplay = (dateStr: string | undefined | null) => {
    if (!dateStr) return '—';
    try { return format(new Date(dateStr), 'dd MMM yyyy'); } catch { return '—'; }
  };

  if (isLoading) {
    return (
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Penyewa</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-xs uppercase tracking-wider">Properti & Unit</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right font-semibold text-xs uppercase tracking-wider">Sewa</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
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
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Penyewa</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-xs uppercase tracking-wider">Properti & Unit</TableHead>
              {mode === "admin" && <TableHead className="hidden lg:table-cell font-semibold text-xs uppercase tracking-wider">Merchant</TableHead>}
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="hidden xl:table-cell font-semibold text-xs uppercase tracking-wider">Periode</TableHead>
              <TableHead className="hidden sm:table-cell text-right font-semibold text-xs uppercase tracking-wider">Sewa</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={mode === "admin" ? 7 : 6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="gradient-icon-box w-12 h-12">
                      <UserX className="h-5 w-5" />
                    </div>
                    <p className="text-sm">Belum ada tenant aktif</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => {
                const { property, unit } = getPropertyDisplay(tenant);
                return (
                  <TableRow key={tenant.id} className="cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => onViewDetails(tenant)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-border/30 ${getAvatarColor(tenant.profile?.full_name)}`}>
                          {getInitials(tenant.profile?.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{tenant.profile?.full_name || 'Tidak Diketahui'}</p>
                          <p className="text-xs text-muted-foreground truncate">{tenant.profile?.email || 'Tanpa Email'}</p>
                          <div className="md:hidden text-xs text-muted-foreground mt-0.5">{property} {unit !== '—' ? `• ${unit}` : ''}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div><p className="font-medium">{property}</p><p className="text-xs text-muted-foreground">{unit}</p></div>
                    </TableCell>
                    {mode === "admin" && (
                      <TableCell className="hidden lg:table-cell">
                        <div><p className="font-medium">{(tenant as AdminTenant).merchant_profile?.full_name || 'Tidak Diketahui'}</p><p className="text-xs text-muted-foreground">{(tenant as AdminTenant).merchant_profile?.email}</p></div>
                      </TableCell>
                    )}
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span>{getDateDisplay(tenant.start_date)}</span>
                        <span className="text-muted-foreground/60">s/d {getDateDisplay(tenant.end_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right font-medium">{getRentDisplay(tenant)}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onViewDetails(tenant)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {onTerminate && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onTerminate(tenant)} className="text-destructive focus:text-destructive">
                                {tenant.status === 'linked' ? (<><UserX className="mr-2 h-4 w-4" />Lepas Tenant</>) : mode === 'admin' ? (<><UserX className="mr-2 h-4 w-4" />Akhiri Sewa</>) : (<><Trash2 className="mr-2 h-4 w-4" />Hapus Tenant</>)}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {(totalPages > 1 || (totalCount && totalCount > itemsPerPage)) && onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2">
          <div className="text-sm text-muted-foreground">
            {totalCount ? (<>Menampilkan {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, totalCount)} dari {totalCount}</>) : (<>{page} / {totalPages}</>)}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-8 rounded-full">
              <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
              {page}/{totalCount ? Math.ceil(totalCount / itemsPerPage) : totalPages}
            </span>
            <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= (totalCount ? Math.ceil(totalCount / itemsPerPage) : totalPages)} className="h-8 rounded-full">
              <span className="hidden sm:inline">Selanjutnya</span><ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
