import { Card, CardContent } from '@/shared/components/ui/card';
import { Wallet, Clock, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';

interface EscrowBalanceCardsProps {
  balance: number;
  pendingBalance: number;
  totalDisbursed: number;
  lastDisbursementDate?: string | null;
}

export function EscrowBalanceCards({
  balance,
  pendingBalance,
  totalDisbursed,
  lastDisbursementDate,
}: EscrowBalanceCardsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Balance</p>
              <p className="text-3xl font-bold text-yellow-600">
                {formatCurrency(pendingBalance)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Awaiting clearance (usually 1-3 business days)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Disbursed</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(totalDisbursed)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
          {lastDisbursementDate && (
            <p className="text-xs text-muted-foreground mt-2">
              Last: {format(new Date(lastDisbursementDate), 'dd MMM yyyy')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-3xl font-bold">
                {formatCurrency(balance + pendingBalance)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
