import { getRelevantContract } from '@/features/contracts/utils/contract-utils';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
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
import { format } from 'date-fns';
import { AlertTriangle, ChevronLeft, ChevronRight, Edit, Eye, MoreHorizontal, User, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full bg-muted/20 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No maintenance requests</h3>
          <p className="text-muted-foreground mt-1">
            When tenants submit requests, they will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const relevantContract = getRelevantContract(request.unit?.contracts, request.tenant_user_id);
            const isNotice = relevantContract?.status === 'notice';
            const isTerminated = relevantContract?.status === 'terminated' || relevantContract?.status === 'expired';

            return (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.unit?.unit_number}
                  {isNotice && (
                    <span title="Tenant in notice period" className="ml-2 text-yellow-600 inline-flex items-center">
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
                    <span className="text-sm font-medium">
                      {request.assigned_to}
                    </span>
                  ) : request.assigned_vendor ? (
                    <span className="text-sm font-medium">
                      {request.assigned_vendor.business_name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(request.created_at), 'MMM dd, yyyy')}
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
                      <DropdownMenuItem asChild>
                        <Link to={`/merchant/maintenance/${request.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(request)}>
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
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalRequests)} of {totalRequests} requests
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
