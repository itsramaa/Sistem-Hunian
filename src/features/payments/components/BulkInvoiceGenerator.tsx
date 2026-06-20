import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, Loader2, Filter, Calendar } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { apiClient } from '@/shared/lib/axios';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';
import { format, addMonths } from 'date-fns';

interface BulkInvoiceGeneratorProps { open: boolean; onOpenChange: (open: boolean) => void; }

interface ActiveContract {
  id: string; tenant_user_id: string; rent_amount: number; billing_day: number | null;
  unit: { unit_number: string; property: { name: string } };
  tenant?: { full_name: string; email: string };
}

export function BulkInvoiceGenerator({ open, onOpenChange }: BulkInvoiceGeneratorProps) {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState(() => format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['active-contracts-bulk', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      try {
        const r = await apiClient.get('/contracts', { params: { merchant_id: merchant.id, status: 'active' } });
        return r.data as ActiveContract[];
      } catch (err) {
        throw err;
      }
    },
    enabled: !!merchant?.id && open,
  });

  const properties = [...new Set(contracts.map(c => c.unit?.property?.name).filter(Boolean))];
  const filteredContracts = contracts.filter(c => propertyFilter === 'all' || c.unit?.property?.name === propertyFilter);

  const toggleContract = (id: string) => {
    setSelectedContracts(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleAll = () => {
    setSelectedContracts(selectedContracts.size === filteredContracts.length ? new Set() : new Set(filteredContracts.map(c => c.id)));
  };

  const generateInvoices = async () => {
    if (!merchant?.id || selectedContracts.size === 0) return;
    setGenerating(true); setProgress(0); setResults({ success: 0, failed: 0 });
    const selectedList = Array.from(selectedContracts);
    let success = 0, failed = 0;

    for (let i = 0; i < selectedList.length; i++) {
      const contract = contracts.find(c => c.id === selectedList[i]);
      if (!contract) { failed++; continue; }
      try {
        const dueDateMonth = format(new Date(dueDate), 'yyyy-MM');
        // Check for existing invoice
        try {
          const existingR = await apiClient.get('/invoices', { params: { contract_id: selectedList[i], due_date_month: dueDateMonth, exclude_status: 'cancelled', limit: 1 } });
          if (existingR.data?.length > 0) { failed++; continue; }
        } catch (_) { /* proceed */ }
        await apiClient.post('/invoices', {
          invoice_number: '', contract_id: selectedList[i], merchant_id: merchant.id,
          tenant_user_id: contract.tenant_user_id, amount: contract.rent_amount,
          tax_amount: 0, total_amount: contract.rent_amount,
          description: `Monthly rent - ${format(new Date(dueDate), 'MMMM yyyy')}`, due_date: dueDate, status: 'draft',
        });
        success++;
      } catch (err) { console.error(err); failed++; }
      setProgress(Math.round(((i + 1) / selectedList.length) * 100));
    }
    setResults({ success, failed }); setGenerating(false);
    if (success > 0) {
      toast({ title: 'Invoices Generated', description: `${success} invoice(s) created${failed > 0 ? `, ${failed} failed` : ''}` });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
    if (failed > 0 && success === 0) toast({ variant: 'destructive', title: 'Generation Failed', description: 'All invoices failed. They may already exist.' });
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const handleClose = () => {
    if (!generating) { setSelectedContracts(new Set()); setProgress(0); setResults({ success: 0, failed: 0 }); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
            Bulk Invoice Generation
          </DialogTitle>
          <DialogDescription>Generate invoices for multiple tenants at once</DialogDescription>
        </DialogHeader>

        {generating ? (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-lg font-medium">Generating Invoices...</p>
              <p className="text-sm text-muted-foreground">{progress}% complete</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : results.success > 0 || results.failed > 0 ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-success" />
            <div>
              <p className="text-lg font-medium">Generation Complete</p>
              <p className="text-muted-foreground">{results.success} invoice(s) created{results.failed > 0 && `, ${results.failed} skipped/failed`}</p>
            </div>
            <Button onClick={handleClose} className="rounded-xl">Close</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 flex-1 overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label>Due Date</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-xl bg-background/60 border-border/50" />
                  </div>
                </div>
                <div className="flex-1">
                  <Label>Property Filter</Label>
                  <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                    <SelectTrigger className="mt-1 rounded-xl bg-background/60 border-border/50">
                      <Filter className="h-4 w-4 mr-2" /><SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map(p => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectedContracts.size === filteredContracts.length && filteredContracts.length > 0} onCheckedChange={toggleAll} id="select-all" />
                  <Label htmlFor="select-all" className="cursor-pointer">Select All ({filteredContracts.length})</Label>
                </div>
                <Badge variant="secondary" className="rounded-full">{selectedContracts.size} selected</Badge>
              </div>

              <div className="overflow-y-auto max-h-[300px] space-y-2 pr-2">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading contracts...</div>
                ) : filteredContracts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No active contracts found</div>
                ) : (
                  filteredContracts.map(contract => (
                    <div
                      key={contract.id}
                      onClick={() => toggleContract(contract.id)}
                      className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        selectedContracts.has(contract.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border/40 bg-card/80 backdrop-blur-sm hover:border-primary/30'
                      }`}
                    >
                      <Checkbox checked={selectedContracts.has(contract.id)} onCheckedChange={() => toggleContract(contract.id)} onClick={(e) => e.stopPropagation()} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contract.tenant?.full_name || contract.tenant?.email || 'Unknown Tenant'}</p>
                        <p className="text-sm text-muted-foreground truncate">{contract.unit?.property?.name} - Unit {contract.unit?.unit_number}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(contract.rent_amount)}</p>
                    </div>
                  ))
                )}
              </div>

              {selectedContracts.size > 0 && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex justify-between items-center">
                  <span className="font-medium">Total to Invoice</span>
                  <span className="text-lg font-bold">{formatCurrency(contracts.filter(c => selectedContracts.has(c.id)).reduce((sum, c) => sum + c.rent_amount, 0))}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="rounded-xl">Cancel</Button>
              <Button onClick={generateInvoices} disabled={selectedContracts.size === 0} className="gradient-cta rounded-xl">
                <FileText className="h-4 w-4 mr-2" />Generate {selectedContracts.size} Invoice(s)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
