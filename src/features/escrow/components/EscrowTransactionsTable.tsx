import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { formatCurrency } from '@/shared/utils/currency';
import { getEscrowStatusColors } from '@/shared/utils/statusColors';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { EscrowTransaction } from '../types';

interface EscrowTransactionsTableProps {
  transactions: EscrowTransaction[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalTransactions: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export function EscrowTransactionsTable({
  transactions,
  loading,
  page,
  totalPages,
  totalTransactions,
  onPageChange,
  itemsPerPage,
}: EscrowTransactionsTableProps) {
  const getStatusBadge = (status: string) => {
    const colors = getEscrowStatusColors(status);
    return (
      <Badge variant="outline" className={colors}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const isDeposit = type === 'deposit' || type === 'payment_received';
    return (
      <div className={`flex items-center gap-1 ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>
        {isDeposit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        <span className="capitalize">{type.replace('_', ' ')}</span>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>; // Replace with Skeleton later
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="text-muted-foreground">
                {format(new Date(tx.created_at), 'dd MMM yyyy')}
              </TableCell>
              <TableCell>{getTypeBadge(tx.type)}</TableCell>
              <TableCell>{tx.description || '-'}</TableCell>
              <TableCell className="font-mono text-sm">
                {tx.reference || '-'}
              </TableCell>
              <TableCell className={`text-right font-medium ${
                tx.type === 'deposit' || tx.type === 'payment_received' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {tx.type === 'deposit' || tx.type === 'payment_received' ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </TableCell>
              <TableCell className="text-right">{getStatusBadge(tx.status || 'pending')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalTransactions)} of {totalTransactions} transactions
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
