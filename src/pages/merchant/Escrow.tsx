import { DisbursementDialog } from '@/features/escrow/components/DisbursementDialog';
import { EscrowBalanceCards } from '@/features/escrow/components/EscrowBalanceCards';
import { EscrowFilters } from '@/features/escrow/components/EscrowFilters';
import { EscrowTransactionsTable } from '@/features/escrow/components/EscrowTransactionsTable';
import { DISBURSEMENT_OPTIONS } from '@/features/escrow/constants';
import { useMerchantEscrow } from '@/features/escrow/hooks/useMerchantEscrow';

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { TabsPageSkeleton } from '@/shared/components/ui/PageSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { formatCurrency } from '@/shared/utils/currency';
import { AlertCircle, Calendar, CreditCard, Info, Send, ShieldAlert, Vault } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MerchantEscrow() {
  const navigate = useNavigate();
  const {
    escrowAccount, merchantData, bankAccount,
    transactions, totalTransactions, totalPages,
    balance, feeAmount, netAmount, minDisbursementAmount, isVerified,
    loadingAccount, loadingTransactions,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    transactionPage, setTransactionPage,
    disbursementDialogOpen, setDisbursementDialogOpen,
    updateSchedule, requestDisbursement,
    ITEMS_PER_PAGE,
  } = useMerchantEscrow();

  if (loadingAccount) {
    return <TabsPageSkeleton statsCount={3} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Vault} title="Escrow Account" description="Manage your escrow balance and disbursements" />

      {/* Non-verified merchant warning */}
      {!isVerified && (
        <Alert variant="destructive" className="border-warning bg-warning/10">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Verification Required</AlertTitle>
          <AlertDescription>
            Your account is not verified. Disbursement requests will require manual review and may take 1-3 business days to process.
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Cards */}
      <EscrowBalanceCards
        balance={escrowAccount?.balance || 0}
        pendingBalance={escrowAccount?.pending_balance || 0}
        totalDisbursed={merchantData?.total_disbursed || 0}
        lastDisbursementDate={merchantData?.last_disbursement_date}
      />

      {/* On-Demand Disbursement */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Request Disbursement Now
          </CardTitle>
          <CardDescription>
            Get your available balance transferred immediately with a 0.5% fee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Available for Disbursement</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(balance)}</p>
              {balance > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fee: {formatCurrency(feeAmount)} • You receive: {formatCurrency(netAmount)}
                </p>
              )}
            </div>
            <Button
              onClick={() => setDisbursementDialogOpen(true)}
              disabled={balance <= 0 || !bankAccount}
              className="gradient-primary"
            >
              <Send className="h-4 w-4 mr-2" />
              Request Now
            </Button>
          </div>
          {balance > 0 && balance < minDisbursementAmount && (
            <Alert className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Minimum disbursement amount is {formatCurrency(minDisbursementAmount)}. Current balance: {formatCurrency(balance)}
              </AlertDescription>
            </Alert>
          )}
          {!bankAccount && (
            <Alert variant="destructive" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bank Account Required</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Please add a primary bank account before requesting disbursement.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/merchant/settings?tab=bank')}
                  className="ml-2"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Bank Account
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Disbursement Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Disbursement Schedule
          </CardTitle>
          <CardDescription>
            Choose when you want to receive your funds automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Schedule</label>
              <Select
                value={merchantData?.disbursement_schedule || 'weekly'}
                onValueChange={(value) => updateSchedule.mutate(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISBURSEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {option.fee}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {DISBURSEMENT_OPTIONS.find(o => o.value === (merchantData?.disbursement_schedule || 'weekly'))?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {DISBURSEMENT_OPTIONS.find(o => o.value === (merchantData?.disbursement_schedule || 'weekly'))?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent escrow transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <EscrowFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            className="mb-6"
          />

          <EscrowTransactionsTable
            transactions={transactions}
            loading={loadingTransactions}
            page={transactionPage}
            totalPages={totalPages}
            totalTransactions={totalTransactions}
            onPageChange={setTransactionPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </CardContent>
      </Card>

      <DisbursementDialog
        open={disbursementDialogOpen}
        onOpenChange={setDisbursementDialogOpen}
        balance={balance}
        feeAmount={feeAmount}
        netAmount={netAmount}
        bankAccount={bankAccount}
        onConfirm={() => requestDisbursement.mutate()}
        isLoading={requestDisbursement.isPending}
        onAddBankAccount={() => navigate('/merchant/settings?tab=bank')}
      />
    </div>
  );
}
