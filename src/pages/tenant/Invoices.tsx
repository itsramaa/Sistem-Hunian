import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Loader2, Download, CreditCard, AlertTriangle } from "lucide-react";
import { StatsCardSkeleton, InvoiceTableSkeleton } from "@/components/ui/skeletons";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { XenditPaymentModal } from "@/components/payment/XenditPaymentModal";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

const TenantInvoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['tenant-invoices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user?.id,
  });

  const downloadInvoicePdf = async (invoiceId: string) => {
    try {
      setDownloadingId(invoiceId);
      toast({ title: 'Generating PDF...', description: 'Please wait' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-invoice-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const result = await response.json();
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
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

  const pendingInvoices = invoices?.filter(i => ['pending', 'sent', 'overdue'].includes(i.status)) || [];
  const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
  const totalPending = pendingInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);

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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Invoices</p>
                <p className="text-2xl font-bold">{pendingInvoices.length}</p>
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
                <p className="text-2xl font-bold">{paidInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Pending Invoices</h2>
          <Card>
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
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            +{formatCurrency(Number(invoice.late_fee))}
                          </Badge>
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
                            onClick={() => setSelectedInvoice(invoice)}
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
        </section>
      )}

      {/* Paid Invoices */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Invoice History</h2>
        {paidInvoices.length > 0 ? (
          <Card>
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
