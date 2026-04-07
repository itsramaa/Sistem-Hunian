import { EscrowAccount } from '@/features/escrow/types';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';

interface AdminEscrowAccountsTableProps {
  accounts: EscrowAccount[];
  loading: boolean;
  onDisburse: (account: EscrowAccount) => void;
}

export function AdminEscrowAccountsTable({
  accounts,
  loading,
  onDisburse
}: AdminEscrowAccountsTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No escrow accounts found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead className="hidden md:table-cell">Pending Balance</TableHead>
            <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">
                <div>{account.merchant?.business_name}</div>
                <div className="md:hidden text-xs text-muted-foreground mt-1">
                  Pending: {formatCurrency(account.pending_balance)}
                </div>
              </TableCell>
              <TableCell>{formatCurrency(account.balance)}</TableCell>
              <TableCell className="hidden md:table-cell">{formatCurrency(account.pending_balance)}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {format(new Date(account.updated_at), 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onDisburse(account)}>
                  Disburse
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
