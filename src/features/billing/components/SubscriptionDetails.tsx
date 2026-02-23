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
import { Activity, AlertCircle, Calendar, CreditCard } from 'lucide-react';
import React from 'react';
import { useBillingStore } from '../hooks/useBillingStore';

export const SubscriptionDetails: React.FC = () => {
  const { subscriptions, loading, currentUsage, recordUsage } = useBillingStore();
  
  if (loading) {
    return <div className="p-4">Loading subscription details...</div>;
  }

  const currentSubscription = subscriptions[0];

  if (!currentSubscription) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>You are currently on the free plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">Subscribe Now</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Manage your plan and billing details</CardDescription>
          </div>
          <Badge variant={currentSubscription.status === 'active' ? 'default' : 'destructive'} className="rounded-full">
            {currentSubscription.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center space-x-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {currentSubscription.plan.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: currentSubscription.plan.currency }).format(currentSubscription.plan.amount)} / {currentSubscription.plan.interval}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                Next Billing Date
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(currentSubscription.current_period_end), 'PPP')}
              </p>
            </div>
          </div>
        </div>

        {currentSubscription.plan.pricing_model === 'usage' && (
          <div className="flex items-center space-x-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 p-4">
            <Activity className="h-6 w-6 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">Current Usage</p>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{currentUsage} units used this period</p>
                <p className="text-sm font-bold">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: currentSubscription.plan.currency }).format(currentUsage * currentSubscription.plan.amount)}
                </p>
              </div>
              <div className="pt-2">
                <Button size="sm" variant="secondary" className="rounded-xl" onClick={() => recordUsage(currentSubscription.id, 1)}>Simulate Usage (+1)</Button>
              </div>
            </div>
          </div>
        )}

        {currentSubscription.status === 'past_due' && (
          <div className="rounded-xl bg-destructive/15 p-4 text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">
              Your payment is past due. Please update your payment method to avoid cancellation.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" className="rounded-xl text-destructive border-destructive hover:bg-destructive/10">
            Cancel Subscription
          </Button>
          <Button variant="outline" className="rounded-xl">
            Update Payment Method
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};