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
import { Label } from '@/shared/components/ui/label';
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
      <PageHeader icon={Vault} title="Rekening Escrow" description="Kelola saldo escrow dan pencairan dana Anda" />

      {/* Non-verified merchant warning */}
      {!isVerified && (
        <Alert variant="destructive" className="border-warning bg-warning/10">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Verifikasi Diperlukan</AlertTitle>
          <AlertDescription>
            Akun Anda belum diverifikasi. Permintaan pencairan dana memerlukan peninjauan manual dan mungkin memakan waktu 1-3 hari kerja untuk diproses.
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
      <Card className="border-primary/20 bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10" aria-hidden="true">
              <Send className="h-5 w-5 text-primary" />
            </div>
            Ajukan Pencairan Sekarang
          </CardTitle>
          <CardDescription>
            Cairkan saldo yang tersedia segera dengan biaya admin 0,5%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/40 gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Tersedia untuk Dicairkan</p>
              <p className="text-3xl font-bold text-success mt-1">{formatCurrency(balance)}</p>
              {balance > 0 && (
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Biaya: {formatCurrency(feeAmount)} • Anda menerima: {formatCurrency(netAmount)}
                </p>
              )}
            </div>
            <Button
              onClick={() => setDisbursementDialogOpen(true)}
              disabled={balance <= 0 || !bankAccount}
              className="gradient-cta rounded-xl shadow-md w-full sm:w-auto"
              aria-label="Cairkan dana sekarang"
            >
              <Send className="h-4 w-4 mr-2" aria-hidden="true" />
              Cairkan Sekarang
            </Button>
          </div>
          {balance > 0 && balance < minDisbursementAmount && (
            <Alert className="rounded-xl border-warning/30 bg-warning/5 text-warning-foreground">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-medium">
                Jumlah pencairan minimum adalah {formatCurrency(minDisbursementAmount)}. Saldo saat ini: {formatCurrency(balance)}
              </AlertDescription>
            </Alert>
          )}
          {!bankAccount && (
            <Alert variant="destructive" className="rounded-xl bg-destructive/5 text-destructive border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <AlertTitle className="text-sm font-bold">Rekening Bank Diperlukan</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-1">
                  <span className="text-xs">Harap tambahkan rekening bank utama sebelum mengajukan pencairan dana.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/merchant/settings?tab=bank')}
                    className="rounded-lg text-[10px] h-8 bg-background/50"
                  >
                    <CreditCard className="h-3 w-3 mr-1.5" />
                    Tambah Rekening
                  </Button>
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Disbursement Schedule */}
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent/10" aria-hidden="true">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            Jadwal Pencairan Otomatis
          </CardTitle>
          <CardDescription>
            Pilih frekuensi pengiriman dana Anda secara otomatis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="disbursement_schedule" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Jadwal Saat Ini</Label>
              <Select
                value={merchantData?.disbursement_schedule || 'weekly'}
                onValueChange={(value) => updateSchedule.mutate(value)}
              >
                <SelectTrigger id="disbursement_schedule" className="rounded-xl bg-background/60 border-border/50 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 bg-popover/95 backdrop-blur-xl">
                  {DISBURSEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0 h-5 bg-primary/5 border-primary/20 text-primary">
                          {option.fee}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/20 rounded-2xl p-5 border border-border/40 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-background/50 border border-border/20 shadow-sm" aria-hidden="true">
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {DISBURSEMENT_OPTIONS.find(o => o.value === (merchantData?.disbursement_schedule || 'weekly'))?.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {DISBURSEMENT_OPTIONS.find(o => o.value === (merchantData?.disbursement_schedule || 'weekly'))?.description}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>Transaksi escrow terbaru</CardDescription>
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
