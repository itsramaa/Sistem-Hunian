import { useNavigate } from 'react-router-dom';
import { Property } from '@/features/properties/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Building2, ChevronLeft, ChevronRight, Copy, DoorOpen, Edit, Image as ImageIcon, MoreHorizontal, RefreshCw, Trash2, Users, Bot } from 'lucide-react';
import { formatLabel } from '@/shared/utils/utils';
import { formatCurrencyCompact } from '@/shared/utils/currency';
import { Label } from '@/shared/components/ui/label';

interface PropertyTableProps {
  properties: Property[];
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onManageUnits: (property: Property) => void;
  onManagePhotos: (property: Property) => void;
  onDuplicate?: (property: Property) => void;
  deleteLoadingId?: string | null;
  page: number;
  totalPages: number;
  totalProperties: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange?: (value: number) => void;
  selectedIds?: Set<string>;
  onSelectId?: (id: string) => void;
  onSelectAll?: () => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
  maintenance: 'Pemeliharaan',
};

function getOccupancyColor(rate: number): string {
  if (rate >= 80) return 'text-success';
  if (rate >= 50) return 'text-warning';
  return 'text-destructive';
}

function getOccupancyBadge(rate: number): { label: string; className: string } {
  if (rate >= 80) return { label: 'BAIK', className: 'bg-success/15 text-success border-success/30' };
  if (rate >= 50) return { label: 'PERHATIAN', className: 'bg-warning/15 text-warning border-warning/30' };
  return { label: 'KRITIS', className: 'bg-destructive/15 text-destructive border-destructive/30' };
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('ellipsis');
  if (total > 1) pages.push(total);
  return pages;
}

export function PropertyTable({ 
  properties, onEdit, onDelete, onManageUnits, onManagePhotos, onDuplicate,
  deleteLoadingId, page, totalPages, totalProperties, onPageChange, itemsPerPage, onItemsPerPageChange,
  selectedIds, onSelectId, onSelectAll,
}: PropertyTableProps) {
  const navigate = useNavigate();
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
            {onSelectId && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={properties.length > 0 && properties.every(p => selectedIds?.has(p.id))}
                  onCheckedChange={() => onSelectAll?.()}
                  aria-label="Pilih semua"
                />
              </TableHead>
            )}
            <TableHead className="font-semibold text-xs uppercase tracking-wider w-[300px]">Properti</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Lokasi</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Unit</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Penyewa</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Pendapatan</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Fasilitas</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Otomasi</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => {
            const occupancyRate = property.total_units > 0 ? (property.occupied_units / property.total_units) * 100 : 0;
            return (
              <TableRow 
                key={property.id} 
                className="group hover:bg-primary/5 transition-colors cursor-pointer" 
                onClick={() => navigate(`/merchant/properties/${property.id}`)}
                role="row"
                aria-label={`Properti ${property.name}`}
              >
                {onSelectId && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds?.has(property.id) ?? false}
                      onCheckedChange={() => onSelectId(property.id)}
                      aria-label={`Pilih ${property.name}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {property.images && property.images.length > 0 ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm">
                        <img src={property.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="gradient-icon-box w-10 h-10 shrink-0" aria-hidden="true">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{property.property_type}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{property.city}, {property.province}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${getOccupancyColor(occupancyRate)}`}>
                        {property.occupied_units}/{property.total_units}
                      </span>
                      <span className="text-xs text-muted-foreground">{Math.round(occupancyRate)}% terisi</span>
                    </div>
                    {property.total_units > 0 && (
                      <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 h-5 rounded-full ${getOccupancyBadge(occupancyRate).className}`}>
                        {getOccupancyBadge(occupancyRate).label}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/merchant/properties/${property.id}?tab=tenants`);
                    }}
                  >
                    <Users className="h-3.5 w-3.5" />
                    {property.active_tenant_count ?? 0}
                  </button>
                </TableCell>
                <TableCell>
                  {(property.monthly_revenue ?? 0) > 0 ? (
                    <span className="text-sm font-medium text-success">
                      {formatCurrencyCompact(property.monthly_revenue!)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {property.amenities && property.amenities.length > 0 ? (
                    <Badge variant="secondary" className="text-xs rounded-full">{property.amenities.length} fasilitas</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-full ${statusColors[property.status]}`}>{statusLabels[property.status] || property.status}</Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground cursor-default">
                          <Bot className="h-3.5 w-3.5" />
                          —
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Segera hadir</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Menu aksi untuk ${property.name}`}>
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => onManageUnits(property)}><DoorOpen className="h-4 w-4 mr-2" aria-hidden="true" />Kelola Unit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onManagePhotos(property)}><ImageIcon className="h-4 w-4 mr-2" aria-hidden="true" />Kelola Foto</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(property)}><Edit className="h-4 w-4 mr-2" aria-hidden="true" />Ubah</DropdownMenuItem>
                      {onDuplicate && <DropdownMenuItem onClick={() => onDuplicate(property)}><Copy className="h-4 w-4 mr-2" aria-hidden="true" />Duplikat</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => onDelete(property)} className="text-destructive focus:text-destructive" disabled={deleteLoadingId === property.id}>
                        {deleteLoadingId === property.id ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />}
                        {deleteLoadingId === property.id ? 'Menghapus...' : 'Hapus'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
          {properties.length === 0 && (
            <TableRow>
              <TableCell colSpan={onSelectId ? 10 : 9} className="h-24 text-center text-muted-foreground">Properti tidak ditemukan.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modern Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/20" role="navigation" aria-label="Navigasi halaman properti">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Menampilkan {((page - 1) * itemsPerPage) + 1} sampai {Math.min(page * itemsPerPage, totalProperties)} dari {totalProperties}
          </span>
          {onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <Label htmlFor="items-per-page" className="sr-only">Item per halaman</Label>
              <Select value={String(itemsPerPage)} onValueChange={(v) => onItemsPerPageChange(Number(v))}>
                <SelectTrigger className="h-8 w-[70px] rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-8 rounded-full" aria-label="Halaman sebelumnya">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          {pageNumbers.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 w-8 p-0 rounded-full ${p === page ? 'gradient-cta text-primary-foreground' : ''}`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Halaman ${p}`}
              >
                {p}
              </Button>
            )
          )}
          <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-8 rounded-full" aria-label="Halaman berikutnya">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
