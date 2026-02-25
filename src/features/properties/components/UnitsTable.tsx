import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shared/components/ui/tooltip";
import { formatCurrency } from "@/shared/utils/currency";
import { ChevronLeft, ChevronRight, Edit, Eye, MoreHorizontal, Trash2, Building2, DoorOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Property, Unit } from "../types";
import { statusColors } from "../utils/unit-utils";
import { cn, formatLabel } from "@/shared/utils/utils";

interface UnitsTableProps {
  units: Unit[];
  properties: Property[];
  onEdit: (unit: Unit) => void;
  onDelete: (id: string) => void;
  page: number;
  totalPages: number;
  totalUnits: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

const statusLabels: Record<string, string> = {
  available: 'Tersedia',
  occupied: 'Terisi',
  maintenance: 'Perbaikan',
  reserved: 'Dipesan',
};

export const UnitsTable = ({
  units, properties, onEdit, onDelete, page, totalPages, totalUnits, onPageChange, itemsPerPage
}: UnitsTableProps) => {
  const navigate = useNavigate();
  
  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.name || 'Tidak diketahui';
  };

  if (units.length === 0) {
    return (
      <div className="glass-table">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="gradient-icon-box w-16 h-16 mb-4" aria-hidden="true">
            <DoorOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-1">Belum ada unit</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Tambahkan unit pertama Anda dengan tombol "Tambah Unit" di atas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Unit</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Properti</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Tipe</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Harga Sewa</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Ukuran</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow
              key={unit.id}
              className="cursor-pointer hover:bg-primary/5 transition-colors group"
              onClick={() => navigate(`/merchant/units/${unit.id}`)}
              role="row"
              aria-label={`Unit ${unit.unit_number}`}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="gradient-icon-box w-8 h-8" aria-hidden="true">
                    <DoorOpen className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-medium">{unit.unit_number}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="truncate max-w-[140px]">{getPropertyName(unit.property_id)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{formatLabel(unit.unit_type) || '—'}</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize text-xs rounded-full", statusColors[unit.status] || '')}>
                  {statusLabels[unit.status] || unit.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(unit.rent_amount)}</TableCell>
              <TableCell className="text-muted-foreground">{unit.size_sqm ? `${unit.size_sqm} m²` : '—'}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate(`/merchant/units/${unit.id}`)} aria-label={`Lihat detail unit ${unit.unit_number}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Lihat Detail</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Menu aksi untuk unit ${unit.unit_number}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(unit)}><Edit className="mr-2 h-4 w-4" aria-hidden="true" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(unit.id)}>
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-3 bg-muted/20" role="navigation" aria-label="Navigasi halaman unit">
          <div className="text-sm text-muted-foreground">
            Menampilkan {((page - 1) * itemsPerPage) + 1}–{Math.min(page * itemsPerPage, totalUnits)} dari {totalUnits} unit
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1} className="h-8 rounded-full" aria-label="Halaman sebelumnya">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary" aria-current="page">{page}/{totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="h-8 rounded-full" aria-label="Halaman berikutnya">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
