import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CreditCard, Loader2 } from 'lucide-react';
import { format, addDays, addWeeks } from 'date-fns';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [installmentCount, setInstallmentCount] = useState('3');
  const [frequency, setFrequency] = useState('bi-weekly');
  const [waiveLateFee, setWaiveLateFee] = useState(false);
  const [terms, setTerms] = useState('');

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
    return Math.ceil(totalAmount / parseInt(installmentCount));
  };

  const generateSchedule = () => {
    const count = parseInt(installmentCount);
    const amount = calculateInstallmentAmount();
    const schedule: { date: Date; amount: number }[] = [];
    
    let currentDate = new Date();
    for (let i = 0; i < count; i++) {
      if (frequency === 'weekly') {
        currentDate = addWeeks(new Date(), i + 1);
      } else if (frequency === 'bi-weekly') {
        currentDate = addWeeks(new Date(), (i + 1) * 2);
      } else {
        currentDate = addDays(new Date(), (i + 1) * 30);
      }
      schedule.push({ date: currentDate, amount });
    }
    
    return schedule;
  };

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error('No invoice selected');

      const totalAmount = waiveLateFee 
        ? invoice.total_amount - (invoice.late_fee || 0)
        : invoice.total_amount;
      const installmentAmount = calculateInstallmentAmount();
      const startDate = new Date();

      // Create payment plan
      const { data: plan, error: planError } = await supabase
        .from('payment_plans')
        .insert({
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
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create installments
      const schedule = generateSchedule();
      const installments = schedule.map((item, index) => ({
        payment_plan_id: plan.id,
        installment_number: index + 1,
        amount: item.amount,
        due_date: item.date.toISOString().split('T')[0],
        status: 'pending',
      }));

      const { error: installmentsError } = await supabase
        .from('payment_plan_installments')
        .insert(installments);

      if (installmentsError) throw installmentsError;

      // Notify tenant
      await supabase.from('notifications').insert({
        user_id: invoice.tenant_user_id,
        title: '📋 Penawaran Cicilan Tersedia',
        message: `Merchant menawarkan rencana cicilan untuk invoice ${invoice.invoice_number}. ${parseInt(installmentCount)} kali cicilan @ ${formatCurrency(installmentAmount)}. ${waiveLateFee ? 'Denda keterlambatan dihapuskan!' : ''}`,
        type: 'payment',
        link: '/tenant/invoices',
      });

      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast({
        title: 'Rencana Cicilan Dibuat',
        description: 'Penawaran cicilan telah dikirim ke penyewa.',
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Membuat Rencana Cicilan',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const schedule = generateSchedule();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Buat Rencana Cicilan
          </DialogTitle>
          <DialogDescription>
            Tawarkan cicilan kepada penyewa untuk invoice {invoice?.invoice_number}
          </DialogDescription>
        </DialogHeader>

        {invoice && (
          <div className="space-y-6">
            {/* Invoice Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tagihan:</span>
                <span className="font-semibold">{formatCurrency(invoice.total_amount)}</span>
              </div>
              {invoice.late_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Termasuk Denda:</span>
                  <span className="text-destructive">{formatCurrency(invoice.late_fee)}</span>
                </div>
              )}
            </div>

            {/* Plan Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Jumlah Cicilan</Label>
                <Select value={installmentCount} onValueChange={setInstallmentCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Kali</SelectItem>
                    <SelectItem value="3">3 Kali</SelectItem>
                    <SelectItem value="4">4 Kali</SelectItem>
                    <SelectItem value="6">6 Kali</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frekuensi Pembayaran</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="bi-weekly">Dua Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {invoice.late_fee > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div>
                    <Label htmlFor="waive-fee">Hapus Denda Keterlambatan</Label>
                    <p className="text-sm text-muted-foreground">
                      Hapus denda {formatCurrency(invoice.late_fee)}
                    </p>
                  </div>
                  <Switch
                    id="waive-fee"
                    checked={waiveLateFee}
                    onCheckedChange={setWaiveLateFee}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Syarat & Ketentuan (Opsional)</Label>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Tambahkan syarat khusus..."
                  rows={2}
                />
              </div>
            </div>

            {/* Schedule Preview */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Jadwal Cicilan
              </Label>
              <div className="border rounded-lg divide-y">
                {schedule.map((item, index) => (
                  <div key={index} className="flex justify-between p-3 text-sm">
                    <span>
                      Cicilan {index + 1} - {format(item.date, 'dd MMM yyyy')}
                    </span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground text-right">
                Total: {formatCurrency(calculateInstallmentAmount() * parseInt(installmentCount))}
                {waiveLateFee && invoice.late_fee > 0 && (
                  <span className="text-green-600 ml-2">
                    (Hemat {formatCurrency(invoice.late_fee)})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={() => createPlanMutation.mutate()}
            disabled={createPlanMutation.isPending}
          >
            {createPlanMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat...
              </>
            ) : (
              'Kirim Penawaran'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
