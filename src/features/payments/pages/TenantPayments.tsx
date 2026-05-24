import { usePaymentTracking } from '@/features/analytics/hooks/useAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PaymentHistoryExport } from '@/features/payments/components/PaymentHistoryExport';
import { XenditPaymentModal } from '@/features/payments/components/XenditPaymentModal';
import { apiClient } from '@/lib/axios';
import { TenantLayout } from '@/shared/components/layouts/TenantLayout';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { PaymentCardSkeleton } from "@/shared/components/ui/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { format, isPast, parseISO } from 'date-fns';
import { AlertTriangle, Calendar, CheckCircle, Clock, CreditCard, DollarSign, FileText, Filter, Info, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

type Payment = {
  id: string;
  amount: number;
  payment_type: string;
  payment_method: string | null;
  reference: string | null;
  status: string;
  due_date: string;
  paid_at: string | null;
  created_at: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  total_amount: number;
  description: string | null;
  status: string;
  due_date: string;
  issued_at: string | null;
  paid_at: string | null;
  late_fee: number | null;
  original_amount: number | null;
  late_fee_applied_at: string | null;
};

export default function TenantPayments() {
  const { user, role } = useAuth();
  const { trackPaymentInitiated } = usePaymentTracking();
  const [selectedPayment, setSelectedPayment] = useState<{ type: 'payment' | 'invoice'; item: Payment | Invoice } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Payment confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'payment' | 'invoice'; item: Payment | Invoice | null }>({
    open: false,
    type: 'payment',
    item: null
  });

  const { data: payments = [], isLoading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = useQuery({
    queryKey: ['tenant-payments-all', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await apiClient.get('/v1/payments', { params: { tenant_user_id: user.id, sort: 'due_date:desc' } });
      return (response.data.data || []) as Payment[];
    },
    enabled: !!user?.id,
  });

  const { data: invoices = [], isLoading: invoicesLoading, error: invoicesError, refetch: refetchInvoices } = useQuery({
    queryKey: ['tenant-invoices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await apiClient.get('/v1/billing/invoices', { params: { tenant_user_id: user.id, exclude_status: 'draft', sort: 'due_date:desc' } });
      return (response.data.data || []) as Invoice[];
    },
    enabled: !!user?.id,
  });

  const handlePayNow = (type: 'payment' | 'invoice', item: Payment | Invoice) => {
    // Validate amount
    const amount = type === 'invoice' ? Number((item as Invoice).total_amount) : Number((item as Payment).amount);
    if (!amount || amount <= 0) {
      return;
    }
    
    // Validate status - only allow payment for pending/sent/overdue
    const validStatuses = ['pending', 'sent', 'overdue'];
    if (!validStatuses.includes(item.status)) {
      return;
    }
    
    // Show confirmation dialog
    setConfirmDialog({ open: true, type, item });
  };

  const confirmPayment = () => {
    if (!confirmDialog.item) return;
    
    const { type, item } = confirmDialog;
    const amount = type === 'invoice' ? Number((item as Invoice).total_amount) : Number((item as Payment).amount);
    
    setSelectedPayment({ type, item });
    trackPaymentInitiated(item.id, amount, type);
    setConfirmDialog({ open: false, type: 'payment', item: null });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent':
        return <Clock className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent':
        return 'secondary';
      case 'paid':
        return 'default';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Helper to check if payment/invoice is overdue
  const isOverdue = (dueDate: string, status: string): boolean => {
    if (status === 'paid') return false;
    return isPast(parseISO(dueDate));
  };

  // Fix: Include overdue status in pending filters
  const pendingPayments = useMemo(() => 
    payments.filter(p => ['pending', 'overdue'].includes(p.status) || (p.status === 'pending' && isOverdue(p.due_date, p.status))),
    [payments]
  );
  
  const paidPayments = payments.filter(p => p.status === 'paid');
  
  // Fix: Include both sent and overdue invoices in pending
  const pendingInvoices = useMemo(() => 
    invoices.filter(i => ['sent', 'overdue'].includes(i.status)),
    [invoices]
  );

  // Filter invoices by status
  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    return invoices.filter(i => i.status === statusFilter);
  }, [invoices, statusFilter]);

  const totalDue = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0) +
    pendingInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);

  const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Tenant role verification
  if (role && role !== 'tenant') {
    return (
      <TenantLayout title="Unauthorized" description="">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  // Error state
  if (paymentsError || invoicesError) {
    return (
      <TenantLayout title="Payments & Invoices" description="View your payment history">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load payment data. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => { refetchPayments(); refetchInvoices(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="Payments & Invoices"
      description="View your payment history"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className={totalDue > 0 ? 'border-destructive/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                totalDue > 0 ? 'bg-destructive/10' : 'bg-yellow-500/10'
              }`}>
                {totalDue > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className={`text-xl font-bold ${totalDue > 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(totalDue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="due" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="due" className="relative">
            Due 
            {(pendingPayments.length + pendingInvoices.length) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingPayments.length + pendingInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* Due Payments Tab */}
        <TabsContent value="due" className="space-y-4">
          {pendingPayments.length === 0 && pendingInvoices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="font-medium">You're all caught up!</p>
                <p className="text-muted-foreground text-sm">No payments due at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {pendingPayments.map((payment) => {
                const overdue = isOverdue(payment.due_date, payment.status);
                return (
                  <Card key={payment.id} className={overdue ? 'border-destructive' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            overdue ? 'bg-destructive/10' : 'bg-primary/10'
                          }`}>
                            {overdue ? (
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                            ) : (
                              <DollarSign className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium capitalize">{payment.payment_type} Payment</p>
                              {overdue && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(payment.due_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <p className={`text-lg font-bold ${overdue ? 'text-destructive' : ''}`}>
                            {formatCurrency(Number(payment.amount))}
                          </p>
                          <Button 
                            size="sm" 
                            onClick={() => handlePayNow('payment', payment)}
                            className="gap-1"
                            variant={overdue ? 'destructive' : 'default'}
                          >
                            <CreditCard className="h-4 w-4" />
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {pendingInvoices.map((invoice) => {
                const hasLateFee = invoice.late_fee && invoice.late_fee > 0;
                const overdue = isOverdue(invoice.due_date, invoice.status) || invoice.status === 'overdue';
                return (
                  <Card key={invoice.id} className={overdue ? 'border-destructive' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            overdue ? 'bg-destructive/10' : 'bg-blue-500/10'
                          }`}>
                            {overdue ? (
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                            ) : (
                              <FileText className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{invoice.invoice_number}</p>
                              {overdue && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                              {hasLateFee && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="gap-1 text-xs cursor-help">
                                        <Info className="h-3 w-3" />
                                        Late Fee
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>A late fee of {formatCurrency(Number(invoice.late_fee))} was applied on {invoice.late_fee_applied_at ? format(new Date(invoice.late_fee_applied_at), 'MMM d, yyyy') : 'overdue date'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                            </p>
                            {invoice.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {invoice.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {hasLateFee && (
                            <div className="text-xs text-muted-foreground">
                              <span className="line-through">{formatCurrency(Number(invoice.original_amount || invoice.amount))}</span>
                              <span className="text-destructive ml-1">+{formatCurrency(Number(invoice.late_fee))}</span>
                            </div>
                          )}
                          <p className={`text-lg font-bold ${overdue ? 'text-destructive' : ''}`}>
                            {formatCurrency(Number(invoice.total_amount))}
                          </p>
                          <Button 
                            size="sm" 
                            onClick={() => handlePayNow('invoice', invoice)}
                            className="gap-1"
                            variant={overdue ? 'destructive' : 'default'}
                          >
                            <CreditCard className="h-4 w-4" />
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          {/* Export Button */}
          <div className="flex justify-end">
            <PaymentHistoryExport
              payments={payments.map(p => ({
                id: p.id,
                date: p.paid_at || p.due_date,
                description: `${p.payment_type} Payment`,
                amount: Number(p.amount),
                status: p.status,
                method: p.payment_method || undefined,
                reference: p.reference || undefined,
              }))}
            />
          </div>
          {paymentsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <PaymentCardSkeleton key={i} />)}
            </div>
          ) : payments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No payment history yet</p>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        payment.status === 'paid' ? 'bg-green-500/10' : 
                        payment.status === 'overdue' ? 'bg-destructive/10' : 'bg-yellow-500/10'
                      }`}>
                        {payment.status === 'paid' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : payment.status === 'overdue' ? (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{payment.payment_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.paid_at 
                            ? `Paid: ${format(new Date(payment.paid_at), 'MMM d, yyyy')}`
                            : `Due: ${format(new Date(payment.due_date), 'MMM d, yyyy')}`
                          }
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(payment.amount))}</p>
                      <Badge variant={getStatusColor(payment.status) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Status Filter */}
          <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invoicesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <PaymentCardSkeleton key={i} />)}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {statusFilter !== 'all' ? 'No invoices match your filter' : 'No invoices yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => {
              const overdue = isOverdue(invoice.due_date, invoice.status) || invoice.status === 'overdue';
              return (
                <Card key={invoice.id} className={overdue && invoice.status !== 'paid' ? 'border-destructive/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          invoice.status === 'paid' ? 'bg-green-500/10' : 
                          overdue ? 'bg-destructive/10' : 'bg-blue-500/10'
                        }`}>
                          {invoice.status === 'paid' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : overdue ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          {invoice.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {invoice.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {invoice.issued_at && `Issued: ${format(new Date(invoice.issued_at), 'MMM d, yyyy')}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(invoice.total_amount))}</p>
                        <Badge variant={getStatusColor(invoice.status) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              You are about to pay the following:
            </DialogDescription>
          </DialogHeader>
          {confirmDialog.item && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {confirmDialog.type === 'invoice' 
                    ? `Invoice ${(confirmDialog.item as Invoice).invoice_number}`
                    : `${(confirmDialog.item as Payment).payment_type} Payment`}
                </span>
                <span className="font-bold text-lg">
                  {formatCurrency(
                    confirmDialog.type === 'invoice' 
                      ? Number((confirmDialog.item as Invoice).total_amount)
                      : Number((confirmDialog.item as Payment).amount)
                  )}
                </span>
              </div>
              {confirmDialog.type === 'invoice' && (confirmDialog.item as Invoice).late_fee && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This amount includes a late fee of {formatCurrency(Number((confirmDialog.item as Invoice).late_fee))}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, type: 'payment', item: null })}>
              Cancel
            </Button>
            <Button onClick={confirmPayment}>
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xendit Payment Modal */}
      {selectedPayment && user && (
        <XenditPaymentModal
          open={!!selectedPayment}
          onOpenChange={(open) => !open && setSelectedPayment(null)}
          amount={selectedPayment.type === 'invoice' 
            ? Number((selectedPayment.item as Invoice).total_amount)
            : Number((selectedPayment.item as Payment).amount)
          }
          originalAmount={selectedPayment.type === 'invoice' && (selectedPayment.item as Invoice).original_amount 
            ? Number((selectedPayment.item as Invoice).original_amount)
            : undefined
          }
          lateFee={selectedPayment.type === 'invoice' && (selectedPayment.item as Invoice).late_fee
            ? Number((selectedPayment.item as Invoice).late_fee)
            : undefined
          }
          description={selectedPayment.type === 'invoice'
            ? `Invoice ${(selectedPayment.item as Invoice).invoice_number}`
            : `${(selectedPayment.item as Payment).payment_type} Payment`
          }
          invoiceId={selectedPayment.type === 'invoice' ? selectedPayment.item.id : undefined}
          paymentId={selectedPayment.type === 'payment' ? selectedPayment.item.id : undefined}
          payerEmail={user.email || ''}
          payerName={user.user_metadata?.full_name || 'Tenant'}
          userId={user.id}
          paymentType={selectedPayment.type === 'invoice' ? 'invoice' : 'rent'}
        />
      )}
    </TenantLayout>
  );
}
