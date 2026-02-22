import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { addMonths, addWeeks, format } from 'date-fns';
import { Calendar, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { usePaymentPlans } from '../hooks/usePaymentPlans';
import { PaymentPlanInstallment } from '../types';

interface PaymentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    total_amount: number;
    late_fee: number;
    tenant_user_id: string;
    merchant_id: string;
  } | null;
}

export function PaymentPlanDialog({ open, onOpenChange, invoice }: PaymentPlanDialogProps) {
  const [installmentCount, setInstallmentCount] = useState('3');
  const [frequency, setFrequency] = useState<'weekly' | 'bi-weekly' | 'monthly'>('bi-weekly');
  const [waiveLateFee, setWaiveLateFee] = useState(false);
  const [terms, setTerms] = useState('');
  
  const { createPaymentPlan, isCreating } = usePaymentPlans();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateInstallmentAmount = () => {
    if (!invoice) return 0;
    const totalAmount = waiveLateFee 
      ? invoice.total_amount - (invoice.late_fee || 0)
      : invoice.total_amount;
    return Math.floor(totalAmount / parseInt(installmentCount));
  };

  const generateSchedule = () => {
    if (!invoice) return [];
    
    const count = parseInt(installmentCount);
    const totalAmount = waiveLateFee 
      ? invoice.total_amount - (invoice.late_fee || 0)
      : invoice.total_amount;
      
    const baseAmount = Math.floor(totalAmount / count);
    const remainder = totalAmount % count;
    
    const schedule: { date: Date; amount: number }[] = [];
    
    for (let i = 0; i < count; i++) {
      let currentDate;
      if (frequency === 'weekly') {
        currentDate = addWeeks(new Date(), i + 1);
      } else if (frequency === 'bi-weekly') {
        currentDate = addWeeks(new Date(), (i + 1) * 2);
      } else {
        currentDate = addMonths(new Date(), i + 1);
      }
      
      // Add remainder to the last installment
      const amount = (i === count - 1) ? baseAmount + remainder : baseAmount;
      
      schedule.push({ date: currentDate, amount });
    }
    
    return schedule;
  };

  const handleSubmit = async () => {
    if (!invoice) return;

    try {
      const totalAmount = waiveLateFee 
        ? invoice.total_amount - (invoice.late_fee || 0)
        : invoice.total_amount;
      const installmentAmount = calculateInstallmentAmount();
      const startDate = new Date();
      
      const schedule = generateSchedule();
      const installments: Omit<PaymentPlanInstallment, 'id' | 'payment_plan_id'>[] = schedule.map((item, index) => ({
        installment_number: index + 1,
        amount: item.amount,
        due_date: item.date.toISOString().split('T')[0],
        status: 'pending',
      }));

      await createPaymentPlan({
        invoice_id: invoice.id,
        tenant_user_id: invoice.tenant_user_id,
        merchant_id: invoice.merchant_id,
        original_amount: totalAmount,
        plan_type: 'installments',
        installment_count: parseInt(installmentCount),
        installment_amount: installmentAmount,
        frequency,
        start_date: startDate.toISOString().split('T')[0],
        late_fee_waived: waiveLateFee,
        waived_amount: waiveLateFee ? (invoice.late_fee || 0) : 0,
        status: 'pending_acceptance',
        terms,
        installments,
        invoice_number: invoice.invoice_number,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create payment plan:', error);
    }
  };

  const schedule = generateSchedule();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Create Payment Plan
          </DialogTitle>
          <DialogDescription>
            Offer an installment plan to the tenant for invoice {invoice?.invoice_number}
          </DialogDescription>
        </DialogHeader>

        {invoice && (
          <div className="space-y-6">
            {/* Invoice Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">{formatCurrency(invoice.total_amount)}</span>
              </div>
              {invoice.late_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Including Late Fee:</span>
                  <span className="text-destructive">{formatCurrency(invoice.late_fee)}</span>
                </div>
              )}
            </div>

            {/* Plan Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Number of Installments</Label>
                <Select value={installmentCount} onValueChange={setInstallmentCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Times</SelectItem>
                    <SelectItem value="3">3 Times</SelectItem>
                    <SelectItem value="4">4 Times</SelectItem>
                    <SelectItem value="6">6 Times</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Frequency</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="waive-fee" className="flex flex-col space-y-1">
                  <span>Waive Late Fee</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Remove {formatCurrency(invoice.late_fee)} late fee from total
                  </span>
                </Label>
                <Switch
                  id="waive-fee"
                  checked={waiveLateFee}
                  onCheckedChange={setWaiveLateFee}
                  disabled={!invoice.late_fee}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Notes / Terms</Label>
                <Textarea 
                  placeholder="Enter notes for the tenant..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>
            </div>

            {/* Schedule Preview */}
            <div className="space-y-2">
              <Label>Estimated Payment Schedule</Label>
              <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                {schedule.map((item, index) => (
                  <div key={index} className="p-3 text-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Installment {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {format(item.date, 'dd MMM yyyy')}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
