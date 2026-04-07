import { Card, CardContent } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { EscrowAccount, EscrowTransaction, PendingDisbursement } from '@/features/escrow/types';
import { AlertCircle, Building2, CheckCircle, Clock, Wallet } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface AdminEscrowStatsProps {
  accounts: EscrowAccount[];
  transactions: EscrowTransaction[];
  totalTransactions: number;
  pendingReviews: PendingDisbursement[];
}

export function AdminEscrowStats({
  accounts,
  transactions,
  pendingReviews
}: AdminEscrowStatsProps) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalPending = accounts.reduce((sum, acc) => sum + acc.pending_balance, 0);
  const completedToday = transactions.filter(tx => 
    tx.status === 'completed' && 
    new Date(tx.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <Wallet className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Accounts</p>
              <p className="text-2xl font-bold">{accounts.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Transactions Today</p>
              <p className="text-2xl font-bold">{completedToday}</p>
            </div>
            <div className="p-3 rounded-lg bg-info/10">
              <CheckCircle className="h-6 w-6 text-info" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className={cn(pendingReviews.length > 0 ? 'border-destructive/50 bg-destructive/5' : '')}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
              <p className="text-2xl font-bold">{pendingReviews.length}</p>
            </div>
            <div className={cn("p-3 rounded-lg", pendingReviews.length > 0 ? 'bg-destructive/20' : 'bg-muted')}>
              <AlertCircle className={cn("h-6 w-6", pendingReviews.length > 0 ? 'text-destructive' : 'text-muted-foreground')} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
