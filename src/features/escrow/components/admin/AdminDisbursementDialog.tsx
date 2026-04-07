import { EscrowAccount } from '@/features/escrow/types';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { formatCurrency } from '@/shared/utils/currency';
import { useState, useEffect } from 'react';

interface AdminDisbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: EscrowAccount | null;
  onProcess: (amount: number, description: string) => void;
}

export function AdminDisbursementDialog({
  open,
  onOpenChange,
  account,
  onProcess,
}: AdminDisbursementDialogProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Admin disbursement');

  useEffect(() => {
    if (open) {
      setAmount('');
      setDescription('Admin disbursement');
    }
  }, [open]);

  const handleSubmit = () => {
    if (!account || !amount) return;
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      onProcess(numAmount, description);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Disbursement</DialogTitle>
          <DialogDescription>
            Manually process a disbursement for {account?.merchant?.business_name}.
            Current Balance: {account && formatCurrency(account.balance)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount (IDR)</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Reason for disbursement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Process</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
