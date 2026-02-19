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
    return <div className="p-8 text-center">Loading billing information...</div>;
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SubscriptionDetails />
          
          <Card>
            <CardHeader>
              <CardTitle>Plan Usage</CardTitle>
              <CardDescription>Overview of your resource usage for the current billing period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Usage metrics will be displayed here (e.g., Properties listed, API calls).
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View and download your past invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Change Plan</CardTitle>
              <CardDescription>Choose the plan that best fits your needs.</CardDescription>
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
