import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle, Loader2, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths } from 'date-fns';

interface BulkInvoiceGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActiveContract {
  id: string;
  tenant_user_id: string;
  rent_amount: number;
  billing_day: number | null;
  unit: {
    unit_number: string;
    property: {
      name: string;
    };
  };
  tenant?: {
    full_name: string;
    email: string;
  };
}

export function BulkInvoiceGenerator({ open, onOpenChange }: BulkInvoiceGeneratorProps) {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState(() => {
    const nextMonth = addMonths(new Date(), 1);
    return format(nextMonth, 'yyyy-MM-dd');
  });
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  // Fetch active contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['active-contracts-bulk', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      
      const { data: contractsData, error } = await supabase
        .from('contracts')
        .select(`
          id,
          tenant_user_id,
          rent_amount,
          billing_day,
          unit:units (
            unit_number,
            property:properties (
              name
            )
          )
        `)
        .eq('merchant_id', merchant.id)
        .eq('status', 'active');
      
      if (error) throw error;

      // Fetch tenant profiles
      const tenantIds = contractsData?.map(c => c.tenant_user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', tenantIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return contractsData?.map(c => ({
        ...c,
        tenant: profileMap.get(c.tenant_user_id),
      })) as ActiveContract[];
    },
    enabled: !!merchant?.id && open,
  });

  // Get unique properties for filter
  const properties = [...new Set(contracts.map(c => c.unit?.property?.name).filter(Boolean))];

  // Filter contracts
  const filteredContracts = contracts.filter(c => {
    if (propertyFilter === 'all') return true;
    return c.unit?.property?.name === propertyFilter;
  });

  const toggleContract = (id: string) => {
    setSelectedContracts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedContracts.size === filteredContracts.length) {
      setSelectedContracts(new Set());
    } else {
      setSelectedContracts(new Set(filteredContracts.map(c => c.id)));
    }
  };

  const generateInvoices = async () => {
    if (!merchant?.id || selectedContracts.size === 0) return;

    setGenerating(true);
    setProgress(0);
    setResults({ success: 0, failed: 0 });

    const selectedList = Array.from(selectedContracts);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < selectedList.length; i++) {
      const contractId = selectedList[i];
      const contract = contracts.find(c => c.id === contractId);
      
      if (!contract) {
        failed++;
        continue;
      }

      try {
        // Check for existing invoice in the same month
        const dueDateMonth = format(new Date(dueDate), 'yyyy-MM');
        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('contract_id', contractId)
          .neq('status', 'cancelled')
          .gte('due_date', `${dueDateMonth}-01`)
          .lte('due_date', `${dueDateMonth}-31`)
          .limit(1);

        if (existing && existing.length > 0) {
          failed++;
          continue;
        }

        // Create invoice
        const { error } = await supabase
          .from('invoices')
          .insert({
            invoice_number: '', // Auto-generated
            contract_id: contractId,
            merchant_id: merchant.id,
            tenant_user_id: contract.tenant_user_id,
            amount: contract.rent_amount,
            tax_amount: 0,
            total_amount: contract.rent_amount,
            description: `Monthly rent - ${format(new Date(dueDate), 'MMMM yyyy')}`,
            due_date: dueDate,
            status: 'draft',
          });

        if (error) throw error;
        success++;
      } catch (err) {
        console.error(`Failed to generate invoice for contract ${contractId}:`, err);
        failed++;
      }

      setProgress(Math.round(((i + 1) / selectedList.length) * 100));
    }

    setResults({ success, failed });
    setGenerating(false);
    
    if (success > 0) {
      toast({
        title: 'Invoices Generated',
        description: `${success} invoice(s) created successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }

    if (failed > 0 && success === 0) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'All invoices failed to generate. They may already exist for this period.',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleClose = () => {
    if (!generating) {
      setSelectedContracts(new Set());
      setProgress(0);
      setResults({ success: 0, failed: 0 });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bulk Invoice Generation
          </DialogTitle>
          <DialogDescription>
            Generate invoices for multiple tenants at once
          </DialogDescription>
        </DialogHeader>

        {generating ? (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-lg font-medium">Generating Invoices...</p>
              <p className="text-sm text-muted-foreground">
                {progress}% complete
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : results.success > 0 || results.failed > 0 ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-success" />
            <div>
              <p className="text-lg font-medium">Generation Complete</p>
              <p className="text-muted-foreground">
                {results.success} invoice(s) created
                {results.failed > 0 && `, ${results.failed} skipped/failed`}
              </p>
            </div>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 flex-1 overflow-hidden">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label>Due Date</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label>Property Filter</Label>
                  <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                    <SelectTrigger className="mt-1">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map(p => (
                        <SelectItem key={p} value={p!}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Select All */}
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedContracts.size === filteredContracts.length && filteredContracts.length > 0}
                    onCheckedChange={toggleAll}
                    id="select-all"
                  />
                  <Label htmlFor="select-all" className="cursor-pointer">
                    Select All ({filteredContracts.length})
                  </Label>
                </div>
                <Badge variant="secondary">
                  {selectedContracts.size} selected
                </Badge>
              </div>

              {/* Contract List */}
              <div className="overflow-y-auto max-h-[300px] space-y-2 pr-2">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading contracts...
                  </div>
                ) : filteredContracts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active contracts found
                  </div>
                ) : (
                  filteredContracts.map(contract => (
                    <Card
                      key={contract.id}
                      className={`cursor-pointer transition-colors ${
                        selectedContracts.has(contract.id) ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => toggleContract(contract.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Checkbox
                          checked={selectedContracts.has(contract.id)}
                          onCheckedChange={() => toggleContract(contract.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {contract.tenant?.full_name || contract.tenant?.email || 'Unknown Tenant'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {contract.unit?.property?.name} - Unit {contract.unit?.unit_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(contract.rent_amount)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Total */}
              {selectedContracts.size > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3 flex justify-between items-center">
                    <span className="font-medium">Total to Invoice</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(
                        contracts
                          .filter(c => selectedContracts.has(c.id))
                          .reduce((sum, c) => sum + c.rent_amount, 0)
                      )}
                    </span>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={generateInvoices} 
                disabled={selectedContracts.size === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate {selectedContracts.size} Invoice(s)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
