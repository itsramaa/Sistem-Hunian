import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { formatCurrency } from '@/shared/utils/currency';
import { useState, useEffect } from 'react';
import { Contract } from '@/features/contracts/types';
import { useToast } from '@/shared/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: Contract[];
  merchantId: string;
  onCreate: (data: {
    contract_id: string;
    merchant_id: string;
    tenant_user_id: string;
    amount: number;
    tax_amount: number;
    description: string;
    due_date: string;
  }) => Promise<void>;
  isCreating: boolean;
}

export const CreateInvoiceDialog = ({
  open,
  onOpenChange,
  contracts,
  merchantId,
  onCreate,
  isCreating
}: CreateInvoiceDialogProps) => {
  const { toast } = useToast();
  const [selectedContractId, setSelectedContractId] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const selectedContract = contracts.find(c => c.id === selectedContractId);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedContractId('');
      setAmount('');
      setTaxAmount('0');
      setDescription('');
      setDueDate('');
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      if (!selectedContract) {
        toast({ title: 'Please select a contract', variant: 'destructive' });
        return;
      }

      const amountNum = parseFloat(amount);
      const taxNum = parseFloat(taxAmount) || 0;

      if (isNaN(amountNum) || amountNum <= 0) {
        toast({ title: 'Amount must be greater than zero', variant: 'destructive' });
        return;
      }

      if (isNaN(taxNum) || taxNum < 0) {
        toast({ title: 'Tax amount cannot be negative', variant: 'destructive' });
        return;
      }

      if (!dueDate) {
        toast({ title: 'Please select a due date', variant: 'destructive' });
        return;
      }

      await onCreate({
        contract_id: selectedContractId,
        merchant_id: merchantId,
        tenant_user_id: selectedContract.tenant_user_id,
        amount: amountNum,
        tax_amount: taxNum,
        description,
        due_date: dueDate,
      });

      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent or react-query mutation
      console.error(error);
    }
  };

  const totalAmount = (parseFloat(amount) || 0) + (parseFloat(taxAmount) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tenant / Contract</Label>
            <Select value={selectedContractId} onValueChange={setSelectedContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tenant" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.unit?.property?.name || 'Unknown Property'} - Unit {contract.unit?.unit_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContract && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p>Monthly Rent: {formatCurrency(selectedContract.rent_amount)}</p>
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
                {formatCurrency(totalAmount)}
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

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedContractId || !amount || !dueDate || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Invoice'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
