import React, { useEffect } from 'react';
import { useBillingStore } from '../hooks/useBillingStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { SubscriptionDetails } from './SubscriptionDetails';
import { InvoiceList } from './InvoiceList';
import { PricingTable } from './PricingTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface BillingDashboardProps {
  customerId: string;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ customerId }) => {
  const { initialize, subscriptions, upgradeSubscription, createSubscription, loading } = useBillingStore();

  useEffect(() => {
    initialize(customerId);
  }, [initialize, customerId]);

  const handlePlanChange = (planId: string) => {
    const currentSub = subscriptions[0];
    if (currentSub) {
      upgradeSubscription(currentSub.id, planId);
    } else {
      createSubscription({ id: customerId, email: 'user@example.com' }, planId);
    }
  };

  if (loading && subscriptions.length === 0) {
    return <div className="p-8 text-center" role="status" aria-label="Memuat informasi tagihan">Memuat informasi tagihan...</div>;
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="inline-flex rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1">
          <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ringkasan</TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Faktur</TabsTrigger>
          <TabsTrigger value="plans" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Paket Tersedia</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SubscriptionDetails />
          
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle>Penggunaan Paket</CardTitle>
              <CardDescription>Ringkasan penggunaan sumber daya Anda untuk periode penagihan saat ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Metrik penggunaan akan ditampilkan di sini (misal: Properti terdaftar, panggilan API).
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle>Riwayat Penagihan</CardTitle>
              <CardDescription>Lihat dan unduh faktur masa lalu Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle>Ganti Paket</CardTitle>
              <CardDescription>Pilih paket yang paling sesuai dengan kebutuhan Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <PricingTable 
                currentPlanId={subscriptions[0]?.plan_id} 
                onSelectPlan={handlePlanChange} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};