import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { TablePagination } from "@/shared/components/ui/TablePagination";
import { formatCurrency } from "@/shared/utils/currency";
import { format } from "date-fns";
import { Eye, FileText, MoreHorizontal, PenLine, Trash2 } from "lucide-react";
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

export function ContractsTable({ contracts, isLoading, tenantProfiles, onView, onSign, onDelete, onMarkNotice, canDelete, page, totalPages, totalContracts, onPageChange, itemsPerPage }: ContractsTableProps) {
  if (isLoading) {
    return (
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Tenant</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Property / Unit</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Duration</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Rent</TableHead>
              <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Signatures</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-36 mt-1" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="glass-table">
        <EmptyState icon={FileText} title="No contracts found" description="Create a new contract to get started." />
      </div>
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Tenant</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Property / Unit</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider">Duration</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Rent</TableHead>
            <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Signatures</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => {
            const tenant = tenantProfiles.get(contract.tenant_user_id);
            const isPast = ['terminated', 'expired', 'completed'].includes(contract.status);
            return (
              <TableRow key={contract.id} className="hover:bg-primary/5 transition-colors">
                <TableCell>
                  <div className="font-medium">{tenant?.full_name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{tenant?.email}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{contract.unit?.property?.name || 'Unknown Property'}</div>
                  <div className="text-sm text-muted-foreground">Unit {contract.unit?.unit_number}</div>
                </TableCell>
                <TableCell><ContractStatusBadge status={contract.status} /></TableCell>
                <TableCell>
                  <div className="text-sm">{format(new Date(contract.start_date), "MMM d, yyyy")} - {format(new Date(contract.end_date), "MMM d, yyyy")}</div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(contract.rent_amount)}<span className="text-xs text-muted-foreground font-normal ml-1">/mo</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center"><SignatureStatusBadge contract={contract} /></div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onView(contract)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                      {!isPast && !contract.merchant_signature_url && contract.tenant_signature_url && (
                        <DropdownMenuItem onClick={() => onSign(contract)}><PenLine className="mr-2 h-4 w-4" />Sign Contract</DropdownMenuItem>
                      )}
                      {onMarkNotice && contract.status === 'active' && (
                        <DropdownMenuItem onClick={() => onMarkNotice(contract)}>Mark Notice Period</DropdownMenuItem>
                      )}
                      {canDelete(contract) && (
                        <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => onDelete(contract)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} totalItems={totalContracts} itemsPerPage={itemsPerPage} onPageChange={onPageChange} itemLabel="contracts" />
    </div>
  );
}
