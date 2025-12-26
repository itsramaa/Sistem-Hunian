import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, DollarSign, Clock, CheckCircle, XCircle, Calendar, Bell, Loader2, CreditCard, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { PaymentPlanDialog } from '@/components/merchant/PaymentPlanDialog';

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
  contract_id: string;
  tenant_user_id: string;
};

type OverdueInvoice = {
  id: string;
  invoice_number: string;
  amount: number;
  total_amount: number;
  late_fee: number;
  due_date: string;
  tenant_user_id: string;
  overdue_since: string | null;
  grace_period_active: boolean;
};

export default function MerchantPayments() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reference, setReference] = useState('');
  const [paymentPlanInvoice, setPaymentPlanInvoice] = useState<OverdueInvoice | null>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('due_date', { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!merchant?.id,
  });

  // Fetch overdue invoices for payment plan
  const { data: overdueInvoices = [] } = useQuery({
    queryKey: ['overdue-invoices', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, total_amount, late_fee, due_date, tenant_user_id, overdue_since, grace_period_active')
        .eq('merchant_id', merchant.id)
        .eq('status', 'pending')
        .lt('due_date', today)
        .is('payment_plan_id', null)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as OverdueInvoice[];
    },
    enabled: !!merchant?.id,
  });

  // Valid payment methods
  const VALID_PAYMENT_METHODS = ['bank_transfer', 'cash', 'card', 'eft', 'other'];

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, payment_method, reference }: { id: string; payment_method: string; reference: string }) => {
      // Validate payment method
      if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
        throw new Error('Please select a valid payment method');
      }

      // Validate reference (optional but sanitize if provided)
      const sanitizedReference = reference.trim().slice(0, 100);

      // Get current payment to validate status
      const payment = payments.find(p => p.id === id);
      if (!payment) throw new Error('Payment not found');
      
      if (payment.status === 'paid') {
        throw new Error('This payment is already marked as paid');
      }

      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          payment_method,
          reference: sanitizedReference || null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Payment marked as paid', description: 'The payment has been recorded successfully' });
      setSelectedPayment(null);
      setPaymentMethod('');
      setReference('');
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update payment', description: error.message, variant: 'destructive' });
    },
  });

  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  const sendReminderMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      setSendingReminderId(paymentId);
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-payment-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentId,
          tenantUserId: payment.tenant_user_id,
          type: 'manual'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reminder');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Reminder sent', description: 'Payment reminder sent to tenant' });
      setSendingReminderId(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send reminder', description: error.message, variant: 'destructive' });
      setSendingReminderId(null);
    },
  });

  // Bulk reminder mutation
  const [sendingBulkReminder, setSendingBulkReminder] = useState(false);
  const sendBulkReminderMutation = useMutation({
    mutationFn: async () => {
      setSendingBulkReminder(true);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/check-overdue-escalation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual', merchantId: merchant?.id }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send reminders');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const processed = data.processed || 0;
      const failed = data.failed || 0;
      let description = `Processed ${processed} overdue invoice${processed !== 1 ? 's' : ''}`;
      if (failed > 0) {
        description += `. ${failed} failed to send.`;
      }
      toast({ title: 'Reminders Sent', description });
      setSendingBulkReminder(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send reminders', description: error.message, variant: 'destructive' });
      setSendingBulkReminder(false);
    },
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.payment_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <XCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const stats = {
    totalCollected: payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    pending: payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    overdue: payments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    thisMonth: payments
      .filter(p => {
        const dueDate = new Date(p.due_date);
        const now = new Date();
        return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  const handleMarkPaid = () => {
    if (!selectedPayment) return;
    
    if (!paymentMethod) {
      toast({ title: 'Payment method required', description: 'Please select a payment method', variant: 'destructive' });
      return;
    }

    markPaidMutation.mutate({
      id: selectedPayment.id,
      payment_method: paymentMethod,
      reference: reference.trim(),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Payments</h1>
          <p className="text-muted-foreground">Track rent payments and payment history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCollected)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          {overdueInvoices.length > 0 && (
            <Button
              variant="outline"
              onClick={() => sendBulkReminderMutation.mutate()}
              disabled={sendingBulkReminder}
            >
              {sendingBulkReminder ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Send All Reminders ({overdueInvoices.length})
            </Button>
          )}
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="overdue" className="relative">
              Overdue Invoices
              {overdueInvoices.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {overdueInvoices.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payments found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium capitalize">{payment.payment_type}</TableCell>
                      <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                      <TableCell>{format(new Date(payment.due_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(payment.status) as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{payment.payment_method || '-'}</TableCell>
                      <TableCell>{payment.reference || '-'}</TableCell>
                      <TableCell>
                        {payment.paid_at ? format(new Date(payment.paid_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(payment.status === 'pending' || payment.status === 'overdue') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setPaymentMethod('');
                                  setReference('');
                                }}
                              >
                                Mark Paid
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => sendReminderMutation.mutate(payment.id)}
                                disabled={sendingReminderId === payment.id}
                                title="Send payment reminder"
                              >
                                {sendingReminderId === payment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Bell className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="overdue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Overdue Invoices - Payment Plan Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueInvoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No overdue invoices! All payments are on track.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Late Fee</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueInvoices.map((invoice) => {
                        const daysOverdue = Math.floor(
                          (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>{formatCurrency(Number(invoice.amount))}</TableCell>
                            <TableCell>
                              {invoice.late_fee > 0 ? (
                                <Badge variant="destructive">+{formatCurrency(Number(invoice.late_fee))}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(Number(invoice.total_amount))}</TableCell>
                            <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <Badge variant={daysOverdue > 7 ? 'destructive' : 'secondary'}>
                                {daysOverdue} days
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPaymentPlanInvoice(invoice)}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Setup Payment Plan
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mark Paid Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payment as Paid</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(Number(selectedPayment.amount))}</p>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="eft">EFT</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number (Optional)</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter payment reference"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                  Cancel
                </Button>
                <Button onClick={handleMarkPaid} disabled={!paymentMethod || markPaidMutation.isPending}>
                  {markPaidMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Plan Dialog */}
      <PaymentPlanDialog
        open={!!paymentPlanInvoice}
        onOpenChange={(open) => !open && setPaymentPlanInvoice(null)}
        invoice={paymentPlanInvoice ? {
          id: paymentPlanInvoice.id,
          invoice_number: paymentPlanInvoice.invoice_number,
          total_amount: paymentPlanInvoice.total_amount,
          late_fee: paymentPlanInvoice.late_fee || 0,
          tenant_user_id: paymentPlanInvoice.tenant_user_id,
          merchant_id: merchant?.id || '',
        } : null}
      />
    </MerchantLayout>
  );
}
