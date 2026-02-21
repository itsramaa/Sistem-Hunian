
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
import { formatCurrency } from '@/shared/utils/currency';
import { differenceInDays, format } from 'date-fns';
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, ClipboardCheck, Eye, MoreHorizontal, Wallet } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-card text-card-foreground shadow-sm">
        <div className="p-4 rounded-full bg-muted mb-4">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No move-outs found</h3>
        <p className="text-muted-foreground mt-1">
          {type === 'upcoming'
            ? 'No upcoming move-outs scheduled.'
            : 'No completed move-outs found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Move-Out Date</TableHead>
            {type === 'upcoming' && <TableHead>Days Left</TableHead>}
            <TableHead>Deposit</TableHead>
            <TableHead>Inspection</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notices.map((notice) => {
            const inspection = inspections?.find((i) => i.move_out_notice_id === notice.id);
            const tenant = tenantProfiles?.[notice.tenant_user_id];
            const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());
            const isUrgent = daysUntil <= 7 && type === 'upcoming';

            return (
              <TableRow key={notice.id}>
                <TableCell className="font-medium">
                  {notice.contract?.unit?.unit_number}
                  <span className="block text-xs text-muted-foreground">
                    {notice.contract?.unit?.property?.name}
                  </span>
                </TableCell>
                <TableCell>
                  {tenant?.full_name || 'Unknown'}
                  <span className="block text-xs text-muted-foreground">
                    {tenant?.phone_number || tenant?.email}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(notice.intended_move_out_date), 'MMM dd, yyyy')}
                  {notice.is_early_termination && (
                    <span className="flex items-center text-xs text-yellow-600 mt-1">
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
                    <span className="text-sm text-green-600 font-medium">Completed</span>
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
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalNotices)} of {totalNotices} move-outs
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
      )}
    </div>
  );
}
