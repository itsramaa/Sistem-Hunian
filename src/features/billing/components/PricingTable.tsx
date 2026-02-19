import React from 'react';
import { Plan } from '../types';
import { useBillingStore } from '../hooks/useBillingStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Check } from 'lucide-react';

interface PricingTableProps {
  currentPlanId?: string;
  onSelectPlan: (planId: string) => void;
}

export const PricingTable: React.FC<PricingTableProps> = ({ currentPlanId, onSelectPlan }) => {
  const { availablePlans, loading } = useBillingStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {availablePlans.map((plan) => (
        <Card key={plan.id} className={currentPlanId === plan.id ? 'border-primary shadow-lg relative' : ''}>
          {currentPlanId === plan.id && (
            <Badge className="absolute top-0 right-0 m-4" variant="secondary">
              Current Plan
            </Badge>
          )}
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: plan.currency }).format(plan.amount)}
              <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
            </div>
            <ul className="space-y-2">
              {plan.features?.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant={currentPlanId === plan.id ? 'outline' : 'default'}
              disabled={loading || currentPlanId === plan.id}
              onClick={() => onSelectPlan(plan.id)}
            >
              {currentPlanId === plan.id ? 'Current Plan' : 'Upgrade'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
