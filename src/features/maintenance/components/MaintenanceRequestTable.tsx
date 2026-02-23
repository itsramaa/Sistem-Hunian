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

export function MaintenanceRequestTable({
  requests,
  onView,
  onEdit,
  loading = false,
  page,
  totalPages,
  totalRequests,
  onPageChange,
  itemsPerPage
}: MaintenanceRequestTableProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border/40">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Unit</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Tenant</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Title</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Category</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Priority</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">SLA</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Assigned</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Created</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="glass-table">
        <EmptyState
          icon={Wrench}
          title="No maintenance requests"
          description="When tenants submit requests, they will appear here."
        />
      </div>
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border/40">
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Unit</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Tenant</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Title</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Category</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Priority</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">SLA</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Assigned</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold">Created</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const relevantContract = getRelevantContract(request.unit?.contracts, request.tenant_user_id);
            const isNotice = relevantContract?.status === 'notice';
            const isTerminated = relevantContract?.status === 'terminated' || relevantContract?.status === 'expired';

            return (
              <TableRow
                key={request.id}
                className="hover:bg-primary/5 transition-colors cursor-pointer"
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
                  {request.tenant?.full_name}
                  <span className="block text-xs text-muted-foreground">
                    {request.tenant?.phone_number || request.tenant?.email}
                  </span>
                </TableCell>
                <TableCell>
                  {request.title}
                  <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
                    {request.description}
                  </span>
                </TableCell>
                <TableCell className="capitalize">{request.category}</TableCell>
                <TableCell>
                  <MaintenancePriorityBadge priority={request.priority} />
                </TableCell>
                <TableCell>
                  <MaintenanceStatusBadge status={request.status} />
                </TableCell>
                <TableCell>
                  <SLABadge slaDeadline={request.sla_deadline} status={request.status} />
                </TableCell>
                <TableCell>
                  {request.assigned_to ? (
                    <span className="text-sm font-medium">{request.assigned_to}</span>
                  ) : request.assigned_vendor ? (
                    <span className="text-sm font-medium">{request.assigned_vendor.business_name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(request.created_at), 'MMM dd, yyyy')}
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