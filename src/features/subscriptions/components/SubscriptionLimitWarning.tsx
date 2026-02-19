import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { useSubscriptionLimits } from '@/features/subscriptions/hooks/useSubscriptionLimits';
import { Link } from 'react-router-dom';

interface SubscriptionLimitWarningProps {
  type: 'property' | 'unit' | 'tenant';
  onUpgrade?: () => void;
}

export function SubscriptionLimitWarning({ type, onUpgrade }: SubscriptionLimitWarningProps) {
  const { data: limits, isLoading } = useSubscriptionLimits();

  if (isLoading || !limits) return null;

  const config = {
    property: {
      canAdd: limits.canAddProperty,
      isNear: limits.isNearPropertyLimit,
      current: limits.currentProperties,
      max: limits.maxProperties,
      label: 'properties',
    },
    unit: {
      canAdd: limits.canAddUnit,
      isNear: limits.isNearUnitLimit,
      current: limits.currentUnits,
      max: limits.maxUnits,
      label: 'units',
    },
    tenant: {
      canAdd: limits.canAddTenant,
      isNear: limits.isNearTenantLimit,
      current: limits.currentTenants,
      max: limits.maxTenants,
      label: 'tenants',
    },
  };

  const { canAdd, isNear, current, max, label } = config[type];

  if (!canAdd) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Limit Reached</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            You've reached your {limits.tierName} plan limit of {max} {label}. 
            Upgrade to add more.
          </span>
          <Button variant="outline" size="sm" asChild className="ml-4">
            <Link to="/merchant/settings?tab=verification">
              Upgrade <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isNear) {
    return (
      <Alert className="mb-4 border-warning/50 bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Approaching Limit</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-warning/90">
            You're using {current} of {max} {label} on your {limits.tierName} plan.
          </span>
          <Button variant="outline" size="sm" asChild className="ml-4">
            <Link to="/merchant/settings?tab=verification">
              Upgrade <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
