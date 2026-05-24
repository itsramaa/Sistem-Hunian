import { MINIMUM_PAYOUT_AMOUNT, PAYOUT_SCHEDULE } from '@/constants/platformFees';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { apiClient } from '@/lib/axios';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Loader2, Save, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function DisbursementScheduleSettings() {
  const { user, merchant } = useAuth();
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState(PAYOUT_SCHEDULE);
  const [billingDay, setBillingDay] = useState('1');
  const [minAmount, setMinAmount] = useState(String(MINIMUM_PAYOUT_AMOUNT));

  useEffect(() => {
    if (merchant) {
      const sub = merchant.merchant_subscriptions?.[0];
      setSchedule(sub?.disbursement_schedule ?? PAYOUT_SCHEDULE);
      setBillingDay(String(sub?.billing_day ?? 1));
      setMinAmount(String((merchant as any).min_disbursement_amount ?? MINIMUM_PAYOUT_AMOUNT));
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
      // 1. Update subscription settings
      await apiClient.put('/merchant-subscriptions', {
        merchant_id: merchant?.id,
        disbursement_schedule: schedule,
        billing_day: parseInt(billingDay),
      });

      // 2. Update merchant aggregate settings
      await apiClient.put('/merchants/' + merchant?.id, {
        min_disbursement_amount: parseInt(minAmount) || MINIMUM_PAYOUT_AMOUNT,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-settings'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Pengaturan pembayaran diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui pengaturan'),
  });

  return (
    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10" aria-hidden="true">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          Jadwal Pembayaran
        </CardTitle>
        <CardDescription>
          Konfigurasi kapan Anda menerima pencairan dana dari pembayaran penyewa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="disbursement_frequency">Frekuensi Pencairan</Label>
          <Select value={schedule} onValueChange={setSchedule}>
            <SelectTrigger id="disbursement_frequency" className="rounded-xl bg-background/60 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan (Setiap Senin)</SelectItem>
              <SelectItem value="biweekly">Dua Mingguan (Tgl 1 & 15)</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Seberapa sering dana ditransfer ke rekening bank Anda
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing_day">Hari Pembuatan Faktur</Label>
          <Select value={billingDay} onValueChange={setBillingDay}>
            <SelectTrigger id="billing_day" className="rounded-xl bg-background/60 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Tanggal 1 setiap bulan</SelectItem>
              <SelectItem value="15">Tanggal 15 setiap bulan</SelectItem>
              <SelectItem value="25">Tanggal 25 setiap bulan</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Kapan faktur bulanan dibuat secara otomatis untuk penyewa
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_amount" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Jumlah Pencairan Minimum
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">
              Rp
            </span>
            <Input
              id="min_amount"
              type="text"
              value={formatCurrency(minAmount)}
              onChange={handleMinAmountChange}
              className="pl-10 rounded-xl bg-background/60 border-border/50"
              placeholder={MINIMUM_PAYOUT_AMOUNT.toLocaleString('id-ID')}
              aria-label="Masukkan jumlah pencairan minimum dalam Rupiah"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Pencairan otomatis hanya akan diproses jika saldo escrow Anda melebihi jumlah ini
          </p>
        </div>

        <Button
          onClick={() => updateSchedule.mutate()}
          disabled={updateSchedule.isPending}
          className="w-full gradient-cta rounded-xl"
        >
          {updateSchedule.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Pengaturan Pembayaran
        </Button>
      </CardContent>
    </Card>
  );
}
