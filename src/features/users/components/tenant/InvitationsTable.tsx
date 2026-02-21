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
            <TableHead>Property</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No pending invitations
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">{invitation.email}</TableCell>
                <TableCell>{invitation.unit?.property?.name || '-'}</TableCell>
                <TableCell>{invitation.unit?.unit_number || '-'}</TableCell>
                <TableCell>
                  <Badge variant={invitation.status === 'pending' ? 'outline' : 'secondary'}>
                    {invitation.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(invitation.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCancel(invitation.id)}
                    disabled={cancelLoadingId === invitation.id}
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
      <div className="flex items-center justify-between px-4 py-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalInvitations)} of {totalInvitations} invitations
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
