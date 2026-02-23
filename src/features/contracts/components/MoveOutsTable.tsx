import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { formatCurrency } from '@/shared/utils/currency';
import { differenceInDays, format } from 'date-fns';
import { AlertTriangle, Calendar, ClipboardCheck, Eye, MoreHorizontal, Wallet } from 'lucide-react';
import { MoveOutInspection, MoveOutNotice, TenantProfile } from '../types';
import { MoveOutStatusBadge } from './MoveOutStatusBadge';

interface MoveOutsTableProps {
  notices: MoveOutNotice[];
  inspections?: MoveOutInspection[];
  tenantProfiles?: Record<string, TenantProfile>;
  onScheduleInspection: (notice: MoveOutNotice) => void;
  onConductInspection: (notice: MoveOutNotice) => void;
  type: 'upcoming' | 'completed';
  page: number;
  totalPages: number;
  totalNotices: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export function MoveOutsTable({
  notices,
  inspections,
  tenantProfiles,
  onScheduleInspection,
  onConductInspection,
  type,
  page,
  totalPages,
  totalNotices,
  onPageChange,
  itemsPerPage
}: MoveOutsTableProps) {
  if (notices.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No move-outs found"
        description={
          type === 'upcoming'
            ? 'No upcoming move-outs scheduled.'
            : 'No completed move-outs found.'
        }
      />
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border/40">
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Unit</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Tenant</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Move-Out Date</TableHead>
            {type === 'upcoming' && <TableHead className="text-xs uppercase tracking-wider font-semibold">Days Left</TableHead>}
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Deposit</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Inspection</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notices.map((notice) => {
            const inspection = inspections?.find((i) => i.move_out_notice_id === notice.id);
            const tenant = tenantProfiles?.[notice.tenant_user_id];
            const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());
            const isUrgent = daysUntil <= 7 && type === 'upcoming';

            return (
              <TableRow key={notice.id} className="hover:bg-primary/5 transition-colors">
                <TableCell className="font-medium">
                  {notice.contract?.unit?.unit_number}
                  <span className="block text-xs text-muted-foreground">
                    {notice.contract?.unit?.property?.name}
                  </span>
                </TableCell>
                <TableCell>
                  {tenant?.full_name || 'Unknown'}
                  <span className="block text-xs text-muted-foreground">
                    {tenant?.email}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(notice.intended_move_out_date), 'MMM dd, yyyy')}
                  {notice.is_early_termination && (
                    <span className="flex items-center text-xs text-warning mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Early Termination
                    </span>
                  )}
                </TableCell>
                {type === 'upcoming' && (
                  <TableCell>
                    <span className={isUrgent ? 'text-destructive font-medium' : ''}>
                      {daysUntil} days
                    </span>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center">
                    <Wallet className="h-3 w-3 mr-1 text-muted-foreground" />
                    {formatCurrency(notice.contract?.deposit_amount || 0)}
                  </div>
                </TableCell>
                <TableCell>
                  {inspection?.status === 'scheduled' ? (
                    <span className="text-sm">
                      {format(new Date(inspection.scheduled_date!), 'MMM dd')}
                    </span>
                  ) : inspection?.status === 'completed' ? (
                    <span className="text-sm text-success font-medium">Completed</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Not scheduled</span>
                  )}
                </TableCell>
                <TableCell>
                  <MoveOutStatusBadge notice={notice} inspection={inspection} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {!inspection && type === 'upcoming' && (
                        <DropdownMenuItem onClick={() => onScheduleInspection(notice)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Inspection
                        </DropdownMenuItem>
                      )}
                      {inspection?.status === 'scheduled' && (
                        <DropdownMenuItem onClick={() => onConductInspection(notice)}>
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Conduct Inspection
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalNotices}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        itemLabel="move-outs"
      />
    </div>
  );
}
