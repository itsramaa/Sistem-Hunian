import { TenantInvitation } from '@/features/users/types/tenant';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { TableRowSkeleton } from '@/shared/components/ui/skeletons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { ChevronLeft, ChevronRight, Mail, Trash2 } from 'lucide-react';

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

const statusConfig: Record<string, { className: string; label: string }> = {
  pending: { className: 'bg-warning/10 text-warning border-warning/30', label: 'Menunggu' },
  accepted: { className: 'bg-success/10 text-success border-success/30', label: 'Diterima' },
  expired: { className: 'bg-muted text-muted-foreground border-muted', label: 'Kedaluwarsa' },
  cancelled: { className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Dibatalkan' },
};

export function InvitationsTable({ invitations, onCancel, loading, cancelLoadingId, page, totalPages, totalInvitations, onPageChange, itemsPerPage }: InvitationsTableProps) {
  if (loading) {
    return (
      <div className="glass-table">
        <div className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (<TableRowSkeleton key={i} columns={5} />))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Email</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold text-xs uppercase tracking-wider">Properti</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold text-xs uppercase tracking-wider">Tanggal Kirim</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <div className="gradient-icon-box w-12 h-12"><Mail className="h-5 w-5 text-muted-foreground" /></div>
                  <p className="text-sm text-muted-foreground">Tidak ada undangan</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((invitation) => (
              <TableRow key={invitation.id} className="hover:bg-primary/5 transition-colors">
                <TableCell className="font-medium">
                  <div>
                    {invitation.email}
                    <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                      {(invitation as any).property_name || invitation.unit?.property?.name || '-'}{' • '}{new Date(invitation.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{(invitation as any).property_name || invitation.unit?.property?.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-full ${statusConfig[invitation.status]?.className || ''}`}>
                    {statusConfig[invitation.status]?.label || invitation.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{new Date(invitation.created_at).toLocaleDateString('id-ID')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onCancel(invitation.id)} disabled={cancelLoadingId === invitation.id || invitation.status !== 'pending'} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-3 bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Menampilkan {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, totalInvitations)} dari {totalInvitations} undangan
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="h-8 rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">{page}/{totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-8 rounded-full">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
