import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, FileText, Send, Eye, Download, DollarSign, Mail, Loader2, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { sendInvoiceNotification } from '@/lib/notifications';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  description: string | null;
  status: string;
  due_date: string;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
  contract_id: string;
  tenant_user_id: string;
};

type Contract = {
  id: string;
  rent_amount: number;
  tenant_user_id: string;
  unit_id: string;
  units?: { unit_number: string; properties?: { name: string } };
};

export default function MerchantInvoices() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!merchant?.id,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['active-contracts', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('*, units(unit_number, properties(name))')
        .eq('merchant_id', merchant.id)
        .eq('status', 'active');
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!merchant?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!merchant?.id) throw new Error('No merchant');
      const contract = contracts.find(c => c.id === selectedContract);
      if (!contract) throw new Error('Contract not found');
      
      const amountNum = parseFloat(amount);
      const taxNum = parseFloat(taxAmount) || 0;
      
      // Validate amount
      if (amountNum <= 0) {
        throw new Error('Amount must be greater than zero');
      }
      
      // Validate tax
      if (taxNum < 0) {
        throw new Error('Tax amount cannot be negative');
      }

      // Validate due date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDateObj = new Date(dueDate);
      if (dueDateObj < today) {
        throw new Error('Due date cannot be in the past');
      }

      // Check for duplicate invoice (same contract, same month)
      const dueDateMonth = format(dueDateObj, 'yyyy-MM');
      const { data: existingInvoices, error: checkError } = await supabase
        .from('invoices')
        .select('id, due_date')
        .eq('contract_id', selectedContract)
        .neq('status', 'cancelled');
      
      if (checkError) throw checkError;
      
      const hasDuplicate = existingInvoices?.some(inv => {
        const invMonth = format(new Date(inv.due_date), 'yyyy-MM');
        return invMonth === dueDateMonth;
      });
      
      if (hasDuplicate) {
        throw new Error('An invoice already exists for this contract in the selected month');
      }
      
      const { error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: '', // Will be auto-generated
          contract_id: selectedContract,
          merchant_id: merchant.id,
          tenant_user_id: contract.tenant_user_id,
          amount: amountNum,
          tax_amount: taxNum,
          total_amount: amountNum + taxNum,
          description: description.slice(0, 1000), // Limit description length
          due_date: dueDate,
          status: 'draft',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice created successfully' });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create invoice', description: error.message, variant: 'destructive' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      // Get invoice details
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Get tenant profile for email
      const { data: tenantProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', invoice.tenant_user_id)
        .single();
      
      if (profileError) throw profileError;

      // Update invoice status
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          issued_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      if (error) throw error;

      // Send email notification
      try {
        await sendInvoiceNotification(
          tenantProfile.email,
          tenantProfile.full_name || 'Tenant',
          {
            invoiceNumber: invoice.invoice_number,
            merchantName: merchant?.business_name || 'Landlord',
            amount: Number(invoice.total_amount),
            dueDate: format(new Date(invoice.due_date), 'MMM d, yyyy'),
            description: invoice.description || undefined,
          }
        );
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't throw - invoice is already sent, just log the error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice sent successfully', description: 'Email notification sent to tenant' });
    },
    onError: () => {
      toast({ title: 'Failed to send invoice', variant: 'destructive' });
    },
  });

  // Valid status transitions
  const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    draft: ['sent', 'cancelled'],
    sent: ['paid', 'overdue', 'cancelled'],
    overdue: ['paid', 'cancelled'],
    paid: [],
    cancelled: [],
  };

  const markPaidMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      // Get current invoice status
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      // Validate status transition
      const allowedTransitions = VALID_STATUS_TRANSITIONS[invoice.status] || [];
      if (!allowedTransitions.includes('paid')) {
        throw new Error(`Cannot mark invoice as paid. Current status: ${invoice.status}`);
      }

      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Invoice marked as paid' });
      setViewInvoice(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update invoice', description: error.message, variant: 'destructive' });
    },
  });

  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  
  const sendReminderMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      setSendingReminderId(invoiceId);
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-payment-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          invoiceId,
          tenantUserId: invoice.tenant_user_id,
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

  const resetForm = () => {
    setSelectedContract('');
    setAmount('');
    setTaxAmount('0');
    setDescription('');
    setDueDate('');
  };

  const downloadInvoicePdf = async (invoiceId: string) => {
    try {
      toast({ title: 'Generating PDF...', description: 'Please wait' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-invoice-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const result = await response.json();
      
      // Open HTML in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'paid': return 'outline';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    total: invoices.reduce((sum, i) => sum + Number(i.total_amount), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total_amount), 0),
    pending: invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + Number(i.total_amount), 0),
    draft: invoices.filter(i => i.status === 'draft').length,
  };

  const selectedContractData = contracts.find(c => c.id === selectedContract);

  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Invoices</h1>
            <p className="text-muted-foreground">Create and manage tenant invoices</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tenant / Contract</Label>
                  <Select value={selectedContract} onValueChange={setSelectedContract}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.units?.properties?.name} - Unit {contract.units?.unit_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedContractData && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p>Monthly Rent: {formatCurrency(selectedContractData.rent_amount)}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Amount</Label>
                    <Input
                      type="number"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {amount && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(parseFloat(amount || '0') + parseFloat(taxAmount || '0'))}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Invoice details..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createMutation.mutate()} 
                    disabled={!selectedContract || !amount || !dueDate || createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {invoice.description || '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(invoice.total_amount))}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status) as "default" | "secondary" | "destructive" | "outline"}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadInvoicePdf(invoice.id)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendMutation.mutate(invoice.id)}
                              disabled={sendMutation.isPending}
                              title="Send invoice with email notification"
                            >
                              {sendMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendReminderMutation.mutate(invoice.id)}
                              disabled={sendingReminderId === invoice.id}
                              title="Send payment reminder"
                            >
                              {sendingReminderId === invoice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Bell className="h-4 w-4" />
                              )}
                            </Button>
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
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="text-xl font-bold">{viewInvoice.invoice_number}</p>
                </div>
                <Badge variant={getStatusColor(viewInvoice.status) as "default" | "secondary" | "destructive" | "outline"}>
                  {viewInvoice.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{format(new Date(viewInvoice.due_date), 'MMM d, yyyy')}</p>
                </div>
                {viewInvoice.issued_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Issued</p>
                    <p className="font-medium">{format(new Date(viewInvoice.issued_at), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>

              {viewInvoice.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{viewInvoice.description}</p>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(viewInvoice.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(Number(viewInvoice.tax_amount))}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(Number(viewInvoice.total_amount))}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {viewInvoice.status === 'draft' && (
                  <Button 
                    onClick={() => {
                      sendMutation.mutate(viewInvoice.id);
                      setViewInvoice(null);
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Invoice
                  </Button>
                )}
                {viewInvoice.status === 'sent' && (
                  <Button 
                    onClick={() => markPaidMutation.mutate(viewInvoice.id)}
                    disabled={markPaidMutation.isPending}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
}
