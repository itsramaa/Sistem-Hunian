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

  const intervalLabels: Record<string, string> = {
    month: 'bulan',
    year: 'tahun',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {availablePlans.map((plan) => (
        <Card key={plan.id} className={`bg-card/90 backdrop-blur-sm rounded-2xl border transition-all ${
          currentPlanId === plan.id 
            ? 'border-primary/50 ring-2 ring-primary/20 shadow-lg shadow-primary/10 relative' 
            : 'border-border/40 hover:border-primary/30 hover:shadow-md'
        }`}>
          {currentPlanId === plan.id && (
            <Badge className="absolute top-0 right-0 m-4 rounded-full" variant="secondary">
              Paket Saat Ini
            </Badge>
          )}
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: plan.currency, maximumFractionDigits: 0 }).format(plan.amount)}
              <span className="text-sm font-normal text-muted-foreground">/{intervalLabels[plan.interval] || plan.interval}</span>
            </div>
            <ul className="space-y-2">
              {plan.features?.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-success/30 to-success/10 flex items-center justify-center shrink-0" aria-hidden="true">
                    <Check className="h-3 w-3 text-success" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className={`w-full rounded-xl ${
                currentPlanId === plan.id 
                  ? '' 
                  : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md'
              }`}
              variant={currentPlanId === plan.id ? 'outline' : 'default'}
              disabled={loading || currentPlanId === plan.id}
              onClick={() => onSelectPlan(plan.id)}
            >
              {currentPlanId === plan.id ? 'Paket Saat Ini' : 'Tingkatkan'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};