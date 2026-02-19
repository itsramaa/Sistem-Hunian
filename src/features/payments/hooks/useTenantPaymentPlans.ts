import { useQuery } from '@tanstack/react-query';
import { paymentPlanService } from '../services/paymentPlanService';

export const useTenantPaymentPlans = (tenantId: string | undefined, statuses?: string[]) => {
  return useQuery({
    queryKey: ['tenant-payment-plans', tenantId, statuses],
    queryFn: () => paymentPlanService.getTenantPaymentPlans(tenantId!, statuses),
    enabled: !!tenantId,
  });
};
