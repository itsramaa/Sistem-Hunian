import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, DollarSign, Clock, CheckCircle, FileText, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
  total_amount: number;
  description: string | null;
  status: string;
  due_date: string;
  issued_at: string | null;
  paid_at: string | null;
};

export default function TenantPayments() {
  const { user } = useAuth();

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['tenant-payments-all', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_user_id', user.id)
        .order('due_date', { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user?.id,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['tenant-invoices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_user_id', user.id)
        .neq('status', 'draft')
        .order('due_date', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user?.id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent':
        return <Clock className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
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

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');
  const pendingInvoices = invoices.filter(i => i.status === 'sent');
  const paidInvoices = invoices.filter(i => i.status === 'paid');

  const totalDue = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0) +
    pendingInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);

  const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/tenant">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-display font-bold">Payments & Invoices</h1>
              <p className="text-sm text-muted-foreground">View your payment history</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Due</p>
                  <p className="text-xl font-bold">{formatCurrency(totalDue)}</p>
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
            <TabsTrigger value="due">
              Due ({pendingPayments.length + pendingInvoices.length})
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
                {pendingPayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{payment.payment_type} Payment</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(payment.due_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(Number(payment.amount))}</p>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingInvoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
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
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(Number(invoice.total_amount))}</p>
                          <Badge variant="secondary">Awaiting Payment</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-4">
            {paymentsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
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
                          payment.status === 'paid' ? 'bg-green-500/10' : 'bg-yellow-500/10'
                        }`}>
                          {payment.status === 'paid' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
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
            {invoicesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : invoices.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No invoices yet</p>
                </CardContent>
              </Card>
            ) : (
              invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          invoice.status === 'paid' ? 'bg-green-500/10' : 'bg-blue-500/10'
                        }`}>
                          <FileText className={`h-5 w-5 ${
                            invoice.status === 'paid' ? 'text-green-600' : 'text-blue-600'
                          }`} />
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
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
