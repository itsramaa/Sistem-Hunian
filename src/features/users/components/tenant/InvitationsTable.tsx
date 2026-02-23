import { TenantInvitation } from '@/features/users/types/tenant';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { TableRowSkeleton } from '@/shared/components/ui/skeletons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

interface InvitationsTableProps {
  invitations: TenantInvitation[];
  onCancel: (id: string) => void;
  loading: boolean;
  cancelLoadingId?: string | null;
  page: number;
  totalPages: number;
  totalInvitations: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export function InvitationsTable({ 
  invitations, 
  onCancel, 
  loading,
  cancelLoadingId,
  page,
  totalPages,
  totalInvitations,
  onPageChange,
  itemsPerPage
}: InvitationsTableProps) {
  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRowSkeleton key={i} columns={6} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead className="hidden sm:table-cell">Properti</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Tanggal Kirim</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Tidak ada undangan
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">
                  <div>
                    {invitation.email}
                    {/* Mobile-only: show property & date inline */}
                    <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                      {(invitation as any).property_name || invitation.unit?.property?.name || '-'}
                      {' • '}
                      {new Date(invitation.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {(invitation as any).property_name || invitation.unit?.property?.name || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={invitation.status === 'pending' ? 'outline' : 'secondary'}>
                    {invitation.status === 'pending' ? 'Menunggu' : 
                     invitation.status === 'accepted' ? 'Diterima' :
                     invitation.status === 'expired' ? 'Kedaluwarsa' :
                     invitation.status === 'cancelled' ? 'Dibatalkan' :
                     invitation.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {new Date(invitation.created_at).toLocaleDateString('id-ID')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCancel(invitation.id)}
                    disabled={cancelLoadingId === invitation.id || invitation.status !== 'pending'}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-4 border-t">
        <div className="text-sm text-muted-foreground">
          Menampilkan {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, totalInvitations)} dari {totalInvitations} undangan
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </Button>
          <div className="text-sm font-medium">
            {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
