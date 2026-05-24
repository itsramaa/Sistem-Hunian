import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Trash2, ClipboardList } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Waitinglist } from '@/features/waitinglist/types/waitinglist';

interface WaitinglistTableProps {
  items: Waitinglist[];
  isLoading?: boolean;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_CONFIG: Record<
  Waitinglist['status'],
  { className: string; label: string }
> = {
  waiting: {
    className: 'bg-warning/10 text-warning border-warning/30',
    label: 'Menunggu',
  },
  notified: {
    className: 'bg-info/10 text-info border-info/30',
    label: 'Diberitahu',
  },
  cancelled: {
    className: 'bg-muted text-muted-foreground border-muted',
    label: 'Dibatalkan',
  },
};

export function WaitinglistTable({
  items,
  isLoading = false,
  onDelete,
}: WaitinglistTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!confirmId) return;
    setDeletingId(confirmId);
    setConfirmId(null);
    try {
      await onDelete(confirmId);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Tenant ID</TableHead>
              <TableHead>Property ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full rounded-md" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border/50 bg-muted/10">
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">Belum ada waiting list</p>
        <p className="text-xs text-muted-foreground">
          Tambahkan tenant ke waiting list untuk properti yang belum tersedia.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-foreground/80">Tenant ID</TableHead>
              <TableHead className="font-semibold text-foreground/80">Property ID</TableHead>
              <TableHead className="font-semibold text-foreground/80">Status</TableHead>
              <TableHead className="font-semibold text-foreground/80">Catatan</TableHead>
              <TableHead className="font-semibold text-foreground/80">Dibuat</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status];
              const isDeleting = deletingId === item.id;

              return (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                    {item.tenant_id}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                    {item.property_id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-full text-xs ${statusCfg.className}`}
                    >
                      {statusCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {item.notes || <span className="italic opacity-50">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(item.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      onClick={() => setConfirmId(item.id)}
                      disabled={isDeleting}
                      aria-label="Hapus dari waiting list"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dari Waiting List?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data waiting list ini akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
