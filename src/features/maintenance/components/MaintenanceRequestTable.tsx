import { getRelevantContract } from '@/features/contracts/utils/contract-utils';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { TablePagination } from '@/shared/components/ui/TablePagination';
import { format } from 'date-fns';
import { AlertTriangle, Edit, Eye, MoreHorizontal, Wrench, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MaintenanceRequest } from '../types';
import { MaintenancePriorityBadge } from './MaintenancePriorityBadge';
import { MaintenanceStatusBadge } from './MaintenanceStatusBadge';
import { SLABadge } from './SLABadge';
import { cn } from '@/shared/utils/utils';

interface MaintenanceRequestTableProps {
  requests: MaintenanceRequest[];
  onView?: (request: MaintenanceRequest) => void;
  onEdit: (request: MaintenanceRequest) => void;
  loading?: boolean;
  page: number;
  totalPages: number;
  totalRequests: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

const PRIORITY_ROW_ACCENT: Record<string, string> = {
  urgent: 'border-l-4 border-l-destructive/60',
  high: 'border-l-4 border-l-warning/60',
  medium: 'border-l-4 border-l-info/60',
  low: 'border-l-4 border-l-muted-foreground/30',
};

const TABLE_HEADERS = [
  'Unit', 'Tenant', 'Title', 'Category', 'Priority', 'Status', 'SLA', 'Assigned', 'Created', ''
];

function TableSkeleton() {
  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border/40">
            {TABLE_HEADERS.map((h, i) => (
              <TableHead key={i} className={cn("text-xs uppercase tracking-wider font-semibold", i === TABLE_HEADERS.length - 1 && "text-right")}>
                {h || 'Actions'}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: TABLE_HEADERS.length }).map((_, j) => (
                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function MaintenanceRequestTable({
  requests,
  onEdit,
  loading = false,
  page,
  totalPages,
  totalRequests,
  onPageChange,
  itemsPerPage
}: MaintenanceRequestTableProps) {
  const navigate = useNavigate();

  if (loading) return <TableSkeleton />;

  if (requests.length === 0) {
    return (
      <div className="glass-table">
        <EmptyState
          icon={Wrench}
          title="Belum ada permintaan maintenance"
          description="Permintaan pemeliharaan dari tenant atau yang Anda buat akan muncul di sini."
        />
      </div>
    );
  }

  return (
    <div className="glass-table">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border/40">
              {TABLE_HEADERS.map((h, i) => (
                <TableHead key={i} className={cn(
                  "text-xs uppercase tracking-wider font-semibold",
                  i === TABLE_HEADERS.length - 1 && "text-right",
                  // Hide some columns on mobile
                  (h === 'Category' || h === 'SLA' || h === 'Assigned') && "hidden lg:table-cell"
                )}>
                  {h || 'Actions'}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const relevantContract = getRelevantContract(request.unit?.contracts, request.tenant_user_id);
              const isNotice = relevantContract?.status === 'notice';
              const isTerminated = relevantContract?.status === 'terminated' || relevantContract?.status === 'expired';
              const accentClass = PRIORITY_ROW_ACCENT[request.priority] || '';

              return (
                <TableRow
                  key={request.id}
                  className={cn("hover:bg-primary/5 transition-colors cursor-pointer", accentClass)}
                  onClick={() => navigate(`/merchant/maintenance/${request.id}`)}
                >
                  <TableCell className="font-medium">
                    {request.unit?.unit_number}
                    {isNotice && (
                      <span title="Tenant in notice period" className="ml-2 text-warning inline-flex items-center">
                        <AlertTriangle className="h-3 w-3" />
                      </span>
                    )}
                    {isTerminated && (
                      <span title="Contract terminated/expired" className="ml-2 text-destructive inline-flex items-center">
                        <XCircle className="h-3 w-3" />
                      </span>
                    )}
                    <span className="block text-xs text-muted-foreground">
                      {request.unit?.property?.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {request.tenant?.full_name || <span className="text-muted-foreground italic text-xs">—</span>}
                    <span className="block text-xs text-muted-foreground">
                      {request.tenant?.phone_number || request.tenant?.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {request.images && request.images.length > 0 && (
                        <img
                          src={request.images[0]}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover border border-border/40 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium block truncate">{request.title}</span>
                        <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
                          {request.description}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize hidden lg:table-cell">{request.category}</TableCell>
                  <TableCell>
                    <MaintenancePriorityBadge priority={request.priority} />
                  </TableCell>
                  <TableCell>
                    <MaintenanceStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <SLABadge slaDeadline={request.sla_deadline} status={request.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {request.assigned_to ? (
                      <span className="text-sm font-medium">{request.assigned_to}</span>
                    ) : request.assigned_vendor ? (
                      <span className="text-sm font-medium">{request.assigned_vendor.business_name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl" onClick={(e) => e.stopPropagation()}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/merchant/maintenance/${request.id}`); }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(request); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalRequests}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        itemLabel="requests"
      />
    </div>
  );
}
