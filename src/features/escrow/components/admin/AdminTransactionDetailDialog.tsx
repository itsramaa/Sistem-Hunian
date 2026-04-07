import { EscrowTransaction } from '@/features/escrow/types';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';

interface AdminTransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: EscrowTransaction | null;
}

export function AdminTransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
}: AdminTransactionDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {transaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">{transaction.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      transaction.status === 'completed' ? 'default' : 'secondary'
                    }
                  >
                    {transaction.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Merchant</p>
                  <p className="font-medium">
                    {transaction.escrow_account?.merchant?.business_name}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <div className="bg-muted p-3 rounded-md text-sm">
                  {transaction.description || 'No description provided'}
                </div>
              </div>

              {transaction.reference && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reference</p>
                  <p className="font-mono text-sm">{transaction.reference}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
