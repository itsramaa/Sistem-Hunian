import { Property } from '../types';
import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Edit, Trash2, MoreHorizontal, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Badge } from '@/shared/components/ui/badge';

interface PropertyTableProps {
  properties: Property[];
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onManageRooms: (property: Property) => void;
  page: number;
  totalPages: number;
  totalProperties: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export function PropertyTable({
  properties, onEdit, onDelete, onManageRooms,
  page, totalPages, totalProperties, onPageChange, itemsPerPage,
}: PropertyTableProps) {
  const start = (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalProperties);

  // Mobile card view vs desktop table
  const [isMobile, _setIsMobile] = useState(false);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {properties.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Belum ada properti. Klik "Tambah Properti" untuk memulai.
          </div>
        ) : (
          properties.map((p) => (
            <div key={p.id} className="glass-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.nama}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.alamat}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)} aria-label="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(p)} aria-label="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.jumlah_kamar !== undefined && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {p.jumlah_kamar} kamar
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
        {/* Pagination */}
        {totalPages > 1 && mobilePagination(page, totalPages, onPageChange, start, end, totalProperties)}
      </div>
    );
  }

  // Desktop table
  return (
    <>
      <div className="glass-table overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
              <TableHead className="font-semibold text-xs uppercase">Nama</TableHead>
              <TableHead className="font-semibold text-xs uppercase">Alamat</TableHead>
              <TableHead className="font-semibold text-xs uppercase text-center">Kamar</TableHead>
              <TableHead className="font-semibold text-xs uppercase text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Belum ada properti. Klik "Tambah Properti" untuk memulai.
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id} className="group hover:bg-primary/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{property.nama}</p>
                        {property.deskripsi && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{property.deskripsi}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                    {property.alamat}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium tabular-nums">{property.jumlah_kamar ?? 0}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Menu ${property.nama}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => onManageRooms(property)}>
                          <Building2 className="h-4 w-4 mr-2" /> Kelola Kamar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(property)}>
                          <Edit className="h-4 w-4 mr-2" /> Ubah
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(property)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Desktop pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2 text-sm text-muted-foreground">
          <span>{start}–{end} dari {totalProperties}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            ))}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );

  function mobilePagination(page: number, total: number, onChange: (p: number) => void, start: number, end: number, totalItems: number) {
    return (
      <div className="flex items-center justify-between px-1 py-2 text-xs text-muted-foreground">
        <span>{start}–{end} dari {totalItems}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full" disabled={page <= 1} onClick={() => onChange(page - 1)}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full" disabled={page >= total} onClick={() => onChange(page + 1)}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }
}
