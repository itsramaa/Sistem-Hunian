import { useAuth } from "@/features/auth/hooks/useAuth";
import { PaymentPlanCard } from "@/features/payments/components/PaymentPlanCard";
import { XenditPaymentModal } from "@/features/payments/components/XenditPaymentModal";
import { useAllTenantInvoices, useDownloadInvoice } from "@/features/payments/hooks/useTenantInvoices";
import { useTenantPaymentPlans } from "@/features/payments/hooks/useTenantPaymentPlans";
import { Invoice } from "@/features/payments/types";
import { TenantLayout } from "@/shared/components/layouts/TenantLayout";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { InvoiceTableSkeleton, StatsCardSkeleton } from "@/shared/components/ui/skeletons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { useToast } from "@/shared/hooks/use-toast";
import { format } from "date-fns";
import { AlertCircle, AlertTriangle, Calendar, CreditCard, Download, FileText, Info, Loader2, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type StatusFilter = 'all' | 'pending' | 'sent' | 'overdue' | 'paid';

const TenantInvoices = () => {
  const { user, role, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Tenant role verification
  const isTenant = role === 'tenant';

  const { data: invoices, isLoading, error, refetch } = useAllTenantInvoices(user?.id);
  const { mutate: downloadInvoice } = useDownloadInvoice();

  // Fetch payment plans
  const { data: paymentPlans = [] } = useTenantPaymentPlans(user?.id, ['pending_acceptance', 'active', 'accepted']);

  // Filtered invoices based on status
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    if (statusFilter === 'all') return invoices;
    return invoices.filter(i => i.status === statusFilter);
  }, [invoices, statusFilter]);

  const pendingInvoices = useMemo(() => 
    filteredInvoices.filter(i => ['pending', 'sent', 'overdue'].includes(i.status)), 
    [filteredInvoices]
  );
  const paidInvoices = useMemo(() => 
    filteredInvoices.filter(i => i.status === 'paid'), 
    [filteredInvoices]
  );
  const totalPending = useMemo(() => 
    (invoices?.filter(i => ['pending', 'sent', 'overdue'].includes(i.status)) || [])
      .reduce((sum, i) => sum + Number(i.total_amount), 0),
    [invoices]
  );
  const overdueCount = useMemo(() => 
    invoices?.filter(i => i.status === 'overdue').length || 0,
    [invoices]
  );

  const downloadInvoicePdf = async (invoiceId: string) => {
    setDownloadingId(invoiceId);
    toast({ title: 'Generating PDF...', description: 'Please wait' });

    downloadInvoice(invoiceId, {
      onSuccess: (result) => {
        if (result.pdfUrl) {
          const link = document.createElement('a');
          link.href = result.pdfUrl;
          link.download = `invoice-${invoiceId}.pdf`;
          link.click();
          toast({ title: 'PDF downloaded successfully' });
        } else if (result.html) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(result.html);
            printWindow.document.close();
            printWindow.onload = () => printWindow.print();
          }
        }
        setDownloadingId(null);
      },
      onError: (error: any) => {
        console.error('Error generating PDF:', error);
        toast({
          title: 'Failed to generate PDF',
          description: error.message || 'Silakan coba lagi',
          variant: 'destructive'
        });
        setDownloadingId(null);
      }
    });
  };

  const handlePayInvoice = (invoice: Invoice) => {
    // Validate invoice status before allowing payment
    if (invoice.status === 'paid') {
      toast({
        title: 'Invoice sudah dibayar',
        description: 'Invoice ini sudah lunas.',
        variant: 'default'
      });
      return;
    }
    
    // Validate amount
    if (!invoice.total_amount || Number(invoice.total_amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Total amount tidak valid.',
        variant: 'destructive'
      });
      return;
    }

    setSelectedInvoice(invoice);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success text-success-foreground">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'sent':
        return <Badge className="bg-info/10 text-info">Sent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Role verification - redirect if not tenant
  if (!authLoading && user && !isTenant) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (isLoading) {
    return (
      <TenantLayout title="My Invoices">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <InvoiceTableSkeleton />
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout title="My Invoices">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Gagal memuat data tagihan. Silakan coba lagi.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="My Invoices"
      description="View and pay your invoices"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? 'border-destructive/50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${overdueCount > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                {overdueCount > 0 ? (
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                ) : (
                  <FileText className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {overdueCount > 0 ? 'Overdue Invoices' : 'Pending Invoices'}
                </p>
                <p className="text-2xl font-bold">
                  {overdueCount > 0 ? overdueCount : (invoices?.filter(i => ['pending', 'sent'].includes(i.status)).length || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Invoices</p>
                <p className="text-2xl font-bold">{invoices?.filter(i => i.status === 'paid').length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Invoices</h2>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Plans Section */}
      {paymentPlans.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payment Plans
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {paymentPlans.map((plan) => (
              <PaymentPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}

      {/* Pending Invoices - Desktop Table */}
      {pendingInvoices.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Pending Invoices</h2>
          
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Late Fee</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvoices.map((invoice) => {
                  const hasLateFee = invoice.late_fee && invoice.late_fee > 0;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.description || 'Monthly Rent'}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {hasLateFee ? (
                          <span className="text-muted-foreground line-through">
                            {formatCurrency(Number(invoice.original_amount || invoice.amount))}
                          </span>
                        ) : (
                          formatCurrency(Number(invoice.amount))
                        )}
                      </TableCell>
                      <TableCell>
                        {hasLateFee ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="destructive" className="gap-1 cursor-help">
                                  <AlertTriangle className="h-3 w-3" />
                                  +{formatCurrency(Number(invoice.late_fee))}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Late fee applied on {invoice.late_fee_applied_at ? format(new Date(invoice.late_fee_applied_at), 'MMM dd, yyyy') : 'overdue date'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(Number(invoice.total_amount))}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadInvoicePdf(invoice.id)}
                            disabled={downloadingId === invoice.id}
                          >
                            {downloadingId === invoice.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            Download
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-primary text-primary-foreground"
                            onClick={() => handlePayInvoice(invoice)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pay Now
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {pendingInvoices.map((invoice) => {
              const hasLateFee = invoice.late_fee && invoice.late_fee > 0;
              return (
                <Card key={invoice.id} className={invoice.status === 'overdue' ? 'border-destructive/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{invoice.description || 'Monthly Rent'}</p>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-bold text-lg">{formatCurrency(Number(invoice.total_amount))}</p>
                      </div>
                    </div>

                    {hasLateFee && (
                      <div className="flex items-center gap-2 text-sm text-destructive mb-3">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Late fee: {formatCurrency(Number(invoice.late_fee))}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Applied on {invoice.late_fee_applied_at ? format(new Date(invoice.late_fee_applied_at), 'MMM dd') : 'overdue'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => downloadInvoicePdf(invoice.id)}
                        disabled={downloadingId === invoice.id}
                      >
                        {downloadingId === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-primary text-primary-foreground"
                        onClick={() => handlePayInvoice(invoice)}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Paid Invoices */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Invoice History</h2>
        {paidInvoices.length > 0 ? (
          <>
            {/* Desktop Table */}
            <Card className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Late Fee</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidInvoices.map((invoice) => {
                    const hasLateFee = invoice.late_fee && invoice.late_fee > 0;
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.description || 'Monthly Rent'}</TableCell>
                        <TableCell>
                          {invoice.paid_at ? format(new Date(invoice.paid_at), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(Number(invoice.original_amount || invoice.amount))}
                        </TableCell>
                        <TableCell>
                          {hasLateFee ? (
                            <span className="text-destructive">
                              +{formatCurrency(Number(invoice.late_fee))}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(Number(invoice.total_amount))}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadInvoicePdf(invoice.id)}
                            disabled={downloadingId === invoice.id}
                          >
                            {downloadingId === invoice.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {paidInvoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {invoice.paid_at ? format(new Date(invoice.paid_at), 'MMM dd, yyyy') : '-'}
                        </p>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{formatCurrency(Number(invoice.total_amount))}</p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => downloadInvoicePdf(invoice.id)}
                        disabled={downloadingId === invoice.id}
                      >
                        {downloadingId === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No paid invoices yet</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Xendit Payment Modal */}
      {selectedInvoice && user && (
        <XenditPaymentModal
          open={!!selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
          amount={Number(selectedInvoice.total_amount)}
          originalAmount={selectedInvoice.original_amount ? Number(selectedInvoice.original_amount) : undefined}
          lateFee={selectedInvoice.late_fee ? Number(selectedInvoice.late_fee) : undefined}
          description={`Invoice ${selectedInvoice.invoice_number}`}
          invoiceId={selectedInvoice.id}
          payerEmail={user.email || ''}
          payerName={user.user_metadata?.full_name || 'Tenant'}
          userId={user.id}
          paymentType="invoice"
        />
      )}
    </TenantLayout>
  );
};

export default TenantInvoices;
