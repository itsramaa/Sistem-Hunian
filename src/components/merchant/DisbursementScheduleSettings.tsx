import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, CalendarDays, Wallet } from 'lucide-react';

export function DisbursementScheduleSettings() {
  const { user, merchant } = useAuth();
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState('weekly');
  const [billingDay, setBillingDay] = useState('1');
  const [minAmount, setMinAmount] = useState('100000');

  useEffect(() => {
    if (merchant) {
      setSchedule(merchant.disbursement_schedule ?? 'weekly');
      setBillingDay(String(merchant.billing_day ?? 1));
      setMinAmount(String((merchant as any).min_disbursement_amount ?? 100000));
    }
  }, [merchant]);

  const formatCurrency = (value: string) => {
    const num = parseInt(value.replace(/\D/g, '')) || 0;
    return num.toLocaleString('id-ID');
  };

  const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setMinAmount(rawValue);
  };

  const updateSchedule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('merchants')
        .update({ 
          disbursement_schedule: schedule,
          billing_day: parseInt(billingDay),
          min_disbursement_amount: parseInt(minAmount) || 100000,
        })
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-settings'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Payment settings updated');
    },
    onError: () => toast.error('Failed to update settings'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Payment Schedule
        </CardTitle>
        <CardDescription>
          Configure when you receive disbursements from tenant payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Disbursement Frequency</Label>
          <Select value={schedule} onValueChange={setSchedule}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly (Every Monday)</SelectItem>
              <SelectItem value="biweekly">Bi-weekly (1st & 15th)</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How often funds are transferred to your bank account
          </p>
        </div>

        <div className="space-y-2">
          <Label>Invoice Generation Day</Label>
          <Select value={billingDay} onValueChange={setBillingDay}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st of each month</SelectItem>
              <SelectItem value="15">15th of each month</SelectItem>
              <SelectItem value="25">25th of each month</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            When monthly invoices are automatically generated for tenants
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Minimum Disbursement Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              Rp
            </span>
            <Input
              type="text"
              value={formatCurrency(minAmount)}
              onChange={handleMinAmountChange}
              className="pl-10"
              placeholder="100,000"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Auto disbursement will only process if your escrow balance exceeds this amount
          </p>
        </div>

        <Button
          onClick={() => updateSchedule.mutate()}
          disabled={updateSchedule.isPending}
          className="w-full"
        >
          {updateSchedule.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Payment Settings
        </Button>
      </CardContent>
    </Card>
  );
}
