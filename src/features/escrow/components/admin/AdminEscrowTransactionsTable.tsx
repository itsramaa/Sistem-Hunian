import { EscrowTransaction } from '@/features/escrow/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/utils';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminEscrowTransactionsTableProps {
  transactions: EscrowTransaction[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminEscrowTransactionsTable({
  transactions,
  loading,
  page,
  totalPages,
  onPageChange
}: AdminEscrowTransactionsTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead className="hidden lg:table-cell">Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                {format(new Date(tx.created_at), 'MMM dd, yyyy')}
                <div className="md:hidden text-xs text-muted-foreground mt-1 capitalize">
                  {tx.type.replace('_', ' ')}
                </div>
              </TableCell>
              <TableCell>
                {tx.escrow_account?.merchant?.business_name || '-'}
                <div className="lg:hidden text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                  {tx.description}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell capitalize">
                {tx.type.replace('_', ' ')}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {tx.description}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(tx.amount)}
              </TableCell>
              <TableCell className="text-right">
                <Badge 
                  variant="outline" 
                  className={cn(
                    tx.status === 'completed' && "border-green-500 text-green-500",
                    tx.status === 'pending' && "border-yellow-500 text-yellow-500",
                    tx.status === 'failed' && "border-red-500 text-red-500"
                  )}
                >
                  {tx.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
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
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
