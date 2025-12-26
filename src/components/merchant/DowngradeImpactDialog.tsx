import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowDown, AlertTriangle, Check, X, Building2, Users, 
  FileText, Wrench, BarChart, Zap, Crown
} from 'lucide-react';

interface SubscriptionTier {
  id: string;
  name: string;
  maxUnits: number;
  maxTenants: number;
  features: string[];
  price: number;
}

interface DowngradeImpactProps {
  currentTier: SubscriptionTier;
  targetTier: SubscriptionTier;
  currentUsage: {
    units: number;
    tenants: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

const FEATURE_ICONS: Record<string, React.ElementType> = {
  'analytics': BarChart,
  'maintenance': Wrench,
  'reports': FileText,
  'priority': Zap,
  'premium': Crown,
};

export function DowngradeImpactDialog({
  currentTier,
  targetTier,
  currentUsage,
  onConfirm,
  onCancel,
}: DowngradeImpactProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Calculate impacts
  const unitOverage = Math.max(0, currentUsage.units - targetTier.maxUnits);
  const tenantOverage = Math.max(0, currentUsage.tenants - targetTier.maxTenants);
  const hasOverage = unitOverage > 0 || tenantOverage > 0;

  // Find lost features
  const lostFeatures = currentTier.features.filter(
    f => !targetTier.features.includes(f)
  );

  // Calculate savings
  const monthlySavings = currentTier.price - targetTier.price;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <ArrowDown className="h-5 w-5" />
          Downgrade Impact
        </CardTitle>
        <CardDescription>
          Review what changes when you downgrade from {currentTier.name} to {targetTier.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overage Warning */}
        {hasOverage && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-medium">Action Required Before Downgrade</p>
              <ul className="text-sm space-y-1">
                {unitOverage > 0 && (
                  <li className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Remove {unitOverage} unit(s) - you have {currentUsage.units} but {targetTier.name} allows {targetTier.maxUnits}
                  </li>
                )}
                {tenantOverage > 0 && (
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Remove {tenantOverage} tenant(s) - you have {currentUsage.tenants} but {targetTier.name} allows {targetTier.maxTenants}
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Comparison Table */}
        <div className="space-y-4">
          <p className="text-sm font-medium">Plan Comparison</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-medium text-muted-foreground">Feature</div>
            <div className="text-center font-medium">{currentTier.name}</div>
            <div className="text-center font-medium">{targetTier.name}</div>

            {/* Units */}
            <div className="flex items-center gap-2 py-2 border-t">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Max Units
            </div>
            <div className="text-center py-2 border-t">{currentTier.maxUnits}</div>
            <div className={`text-center py-2 border-t ${targetTier.maxUnits < currentTier.maxUnits ? 'text-destructive font-medium' : ''}`}>
              {targetTier.maxUnits}
              {targetTier.maxUnits < currentTier.maxUnits && (
                <ArrowDown className="h-3 w-3 inline ml-1" />
              )}
            </div>

            {/* Tenants */}
            <div className="flex items-center gap-2 py-2 border-t">
              <Users className="h-4 w-4 text-muted-foreground" />
              Max Tenants
            </div>
            <div className="text-center py-2 border-t">{currentTier.maxTenants}</div>
            <div className={`text-center py-2 border-t ${targetTier.maxTenants < currentTier.maxTenants ? 'text-destructive font-medium' : ''}`}>
              {targetTier.maxTenants}
              {targetTier.maxTenants < currentTier.maxTenants && (
                <ArrowDown className="h-3 w-3 inline ml-1" />
              )}
            </div>
          </div>
        </div>

        {/* Lost Features */}
        {lostFeatures.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">Features You'll Lose</p>
            <div className="space-y-2">
              {lostFeatures.map((feature) => {
                const Icon = FEATURE_ICONS[feature.toLowerCase()] || X;
                return (
                  <div 
                    key={feature}
                    className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <X className="h-4 w-4 text-destructive" />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{feature}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kept Features */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-green-600">Features You'll Keep</p>
          <div className="grid grid-cols-2 gap-2">
            {targetTier.features.map((feature) => {
              const Icon = FEATURE_ICONS[feature.toLowerCase()] || Check;
              return (
                <div 
                  key={feature}
                  className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20"
                >
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <span className="text-sm">Monthly Savings</span>
            <Badge variant="secondary" className="text-green-600">
              {formatCurrency(monthlySavings)}/bulan
            </Badge>
          </div>
        </div>

        {/* Acknowledgment */}
        <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            I understand that downgrading will reduce my limits and remove some features. 
            {hasOverage && ' I will remove excess units/tenants before the change takes effect.'}
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1"
            disabled={!acknowledged || hasOverage}
            onClick={onConfirm}
          >
            Confirm Downgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
