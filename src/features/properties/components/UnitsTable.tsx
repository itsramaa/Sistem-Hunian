import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { formatCurrency } from "@/shared/utils/currency";
import { ChevronLeft, ChevronRight, Edit, Eye, MoreHorizontal, Trash2, Building2, DoorOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Property, Unit } from "../types";
import { statusColors } from "../utils/unit-utils";
import { cn } from "@/shared/utils/utils";

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
  units,
  properties,
  onEdit,
  onDelete,
  page,
  totalPages,
  totalUnits,
  onPageChange,
  itemsPerPage
}: UnitsTableProps) => {
  const navigate = useNavigate();
  
  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.name || 'Unknown';
  };

  if (units.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-4 rounded-full bg-muted mb-4">
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
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Unit</TableHead>
            <TableHead className="font-semibold">Properti</TableHead>
            <TableHead className="font-semibold">Tipe</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Harga Sewa</TableHead>
            <TableHead className="font-semibold">Ukuran</TableHead>
            <TableHead className="text-right font-semibold">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow
              key={unit.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors group"
              onClick={() => navigate(`/merchant/units/${unit.id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <DoorOpen className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-medium">{unit.unit_number}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[140px]">{getPropertyName(unit.property_id)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="capitalize text-sm">{unit.unit_type?.replace(/_/g, ' ') || '—'}</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize text-xs", statusColors[unit.status] || '')}>
                  {statusLabels[unit.status] || unit.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(unit.rent_amount)}</TableCell>
              <TableCell className="text-muted-foreground">{unit.size_sqm ? `${unit.size_sqm} m²` : '—'}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate(`/merchant/units/${unit.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Lihat Detail</TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(unit)}>
                        <Edit className="mr-2 h-4 w-4" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(unit.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />Hapus
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
        <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/30">
          <div className="text-sm text-muted-foreground">
            Menampilkan {((page - 1) * itemsPerPage) + 1}–{Math.min(page * itemsPerPage, totalUnits)} dari {totalUnits} unit
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />Sebelumnya
            </Button>
            <span className="text-sm font-medium px-2">{page}/{totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              Berikutnya<ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
