import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/shared/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Activity, AlertCircle, Calendar, CreditCard } from 'lucide-react';
import React from 'react';
import { useBillingStore } from '../hooks/useBillingStore';

export const SubscriptionDetails: React.FC = () => {
  const { subscriptions, loading, currentUsage, recordUsage } = useBillingStore();
  
  if (loading) {
    return <div className="p-4" role="status" aria-label="Memuat detail langganan">Memuat detail langganan...</div>;
  }

  const currentSubscription = subscriptions[0];

  const statusLabels: Record<string, string> = {
    active: 'Aktif',
    past_due: 'Melewati Jatuh Tempo',
    canceled: 'Dibatalkan',
    incomplete: 'Tidak Lengkap',
    trialing: 'Uji Coba',
  };

  const intervalLabels: Record<string, string> = {
    month: 'bulan',
    year: 'tahun',
  };

  if (!currentSubscription) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
        <CardHeader>
          <CardTitle>Tidak Ada Langganan Aktif</CardTitle>
          <CardDescription>Anda saat ini menggunakan paket gratis.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">Berlangganan Sekarang</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Langganan Saat Ini</CardTitle>
            <CardDescription>Kelola paket dan detail penagihan Anda</CardDescription>
          </div>
          <Badge variant={currentSubscription.status === 'active' ? 'default' : 'destructive'} className="rounded-full">
            {statusLabels[currentSubscription.status] || currentSubscription.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center space-x-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center" aria-hidden="true">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {currentSubscription.plan.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: currentSubscription.plan.currency, maximumFractionDigits: 0 }).format(currentSubscription.plan.amount)} / {intervalLabels[currentSubscription.plan.interval] || currentSubscription.plan.interval}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center" aria-hidden="true">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                Tanggal Penagihan Berikutnya
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(currentSubscription.current_period_end), 'dd MMMM yyyy', { locale: id })}
              </p>
            </div>
          </div>
        </div>

        {currentSubscription.plan.pricing_model === 'usage' && (
          <div className="flex items-center space-x-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4">
            <Activity className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">Penggunaan Saat Ini</p>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{currentUsage} unit digunakan pada periode ini</p>
                <p className="text-sm font-bold">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: currentSubscription.plan.currency, maximumFractionDigits: 0 }).format(currentUsage * currentSubscription.plan.amount)}
                </p>
              </div>
              <div className="pt-2">
                <Button size="sm" variant="secondary" className="rounded-xl" onClick={() => recordUsage(currentSubscription.id, 1)}>Simulasi Penggunaan (+1)</Button>
              </div>
            </div>
          </div>
        )}

        {currentSubscription.status === 'past_due' && (
          <div className="rounded-xl bg-destructive/15 p-4 text-destructive flex items-center gap-2" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm font-medium">
              Pembayaran Anda telah melewati jatuh tempo. Harap perbarui metode pembayaran Anda untuk menghindari pembatalan.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" className="rounded-xl text-destructive border-destructive hover:bg-destructive/10">
            Batalkan Langganan
          </Button>
          <Button variant="outline" className="rounded-xl">
            Perbarui Metode Pembayaran
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};