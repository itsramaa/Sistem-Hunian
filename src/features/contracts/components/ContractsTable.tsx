import { Button } from "@/shared/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/currency";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, Loader2, MoreHorizontal, PenLine, Trash2 } from "lucide-react";
import { Contract, TenantProfile } from "../types";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { SignatureStatusBadge } from "./SignatureStatusBadge";

interface ContractsTableProps {
  contracts: Contract[];
  isLoading: boolean;
  tenantProfiles: Map<string, TenantProfile>;
  onView: (contract: Contract) => void;
  onSign: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  onMarkNotice?: (contract: Contract) => void;
  canDelete: (contract: Contract) => boolean;
  page: number;
  totalPages: number;
  totalContracts: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export function ContractsTable({
  contracts,
  isLoading,
  tenantProfiles,
  onView,
  onSign,
  onDelete,
  onMarkNotice,
  canDelete,
  page,
  totalPages,
  totalContracts,
  onPageChange,
  itemsPerPage
}: ContractsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No contracts found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Property / Unit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Rent Amount</TableHead>
            <TableHead className="text-center">Signatures</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => {
            const tenant = tenantProfiles.get(contract.tenant_user_id);
            const isPast = ['terminated', 'expired', 'completed'].includes(contract.status);
            
            return (
              <TableRow key={contract.id}>
                <TableCell>
                  <div className="font-medium">{tenant?.full_name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{tenant?.email}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{contract.unit?.property?.name || 'Unknown Property'}</div>
                  <div className="text-sm text-muted-foreground">Unit {contract.unit?.unit_number}</div>
                </TableCell>
                <TableCell>
                  <ContractStatusBadge status={contract.status} />
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(contract.start_date), "MMM d, yyyy")} -{" "}
                    {format(new Date(contract.end_date), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(contract.rent_amount)}
                  <span className="text-xs text-muted-foreground font-normal ml-1">/mo</span>
                </TableCell>
                <TableCell className="text-center">
                   <div className="flex justify-center">
                     <SignatureStatusBadge contract={contract} />
                   </div>
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
                      <DropdownMenuItem onClick={() => onView(contract)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {!isPast && !contract.merchant_signature_url && contract.tenant_signature_url && (
                        <DropdownMenuItem onClick={() => onSign(contract)}>
                          <PenLine className="mr-2 h-4 w-4" />
                          Sign Contract
                        </DropdownMenuItem>
                      )}
                      {onMarkNotice && contract.status === 'active' && (
                         <DropdownMenuItem onClick={() => onMarkNotice(contract)}>
                           Mark Notice Period
                         </DropdownMenuItem>
                      )}
                      {canDelete(contract) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete(contract)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
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
            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalContracts)} of {totalContracts} contracts
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
