import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useMemo } from 'react';
import { format, subMonths, differenceInMonths } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

export function useReportsData(merchantId: string | undefined, effectiveDateRange: DateRange) {
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-with-units', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data } = await apiClient.get('/properties', {
        params: { select: '*,units(*)', merchant_id: merchantId },
      });
      return data || [];
    },
    enabled: !!merchantId,
  });

  const { data: payments = [], isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ['payment-analytics', merchantId, effectiveDateRange.from?.toISOString(), effectiveDateRange.to?.toISOString()],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data } = await apiClient.get('/payments', {
        params: {
          merchant_id: merchantId,
          'created_at': `gte.${effectiveDateRange.from.toISOString()}`,
          'created_at_lte': `lte.${effectiveDateRange.to.toISOString()}`,
          order: 'created_at.asc',
        },
      });
      return data || [];
    },
    enabled: !!merchantId && !!effectiveDateRange.from,
  });

  const { data: previousPayments = [] } = useQuery({
    queryKey: ['payment-analytics-previous', merchantId, effectiveDateRange.from?.toISOString()],
    queryFn: async () => {
      if (!merchantId || !effectiveDateRange.from || !effectiveDateRange.to) return [];
      const months = differenceInMonths(effectiveDateRange.to, effectiveDateRange.from) || 1;
      const previousFrom = subMonths(effectiveDateRange.from, months);
      const previousTo = subMonths(effectiveDateRange.to, months);

      const { data } = await apiClient.get('/payments', {
        params: {
          select: 'amount,status',
          merchant_id: merchantId,
          status: 'eq.paid',
          'created_at': `gte.${previousFrom.toISOString()}`,
          'created_at_lte': `lte.${previousTo.toISOString()}`,
        },
      });
      return data || [];
    },
    enabled: !!merchantId && !!effectiveDateRange.from,
  });

  const { data: maintenanceRequests = [], isLoading: maintenanceLoading, error: maintenanceError } = useQuery({
    queryKey: ['maintenance-analytics', merchantId, effectiveDateRange.from?.toISOString(), effectiveDateRange.to?.toISOString()],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data } = await apiClient.get('/maintenance-requests', {
        params: {
          merchant_id: merchantId,
          'created_at': `gte.${effectiveDateRange.from.toISOString()}`,
          'created_at_lte': `lte.${effectiveDateRange.to.toISOString()}`,
        },
      });
      return data || [];
    },
    enabled: !!merchantId && !!effectiveDateRange.from,
  });

  const isLoading = paymentsLoading || maintenanceLoading;
  const hasError = paymentsError || maintenanceError;

  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length || 0), 0);
  const occupiedUnits = properties.reduce(
    (sum, p) => sum + (p.units?.filter((u: { status: string }) => u.status === 'occupied').length || 0),
    0
  );
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const totalRevenue = useMemo(() =>
    payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
    [payments]
  );

  const previousRevenue = useMemo(() =>
    previousPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    [previousPayments]
  );

  const revenueChange = useMemo(() => {
    if (previousRevenue === 0) return 0;
    return Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100);
  }, [totalRevenue, previousRevenue]);

  const pendingPayments = useMemo(() =>
    payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
    [payments]
  );

  const revenueData = useMemo(() => {
    const months: { [key: string]: number } = {};
    const numMonths = Math.max(1, differenceInMonths(effectiveDateRange.to, effectiveDateRange.from));

    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(effectiveDateRange.to, i);
      const key = format(date, 'MMM yyyy');
      months[key] = 0;
    }

    payments
      .filter(p => p.status === 'paid' && p.paid_at)
      .forEach(p => {
        const key = format(new Date(p.paid_at!), 'MMM yyyy');
        if (months[key] !== undefined) {
          months[key] += Number(p.amount);
        }
      });

    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
  }, [payments, effectiveDateRange]);

  const occupancyByType = useMemo(() => {
    const types: { [key: string]: { total: number; occupied: number } } = {};

    properties.forEach(p => {
      if (!types[p.property_type]) {
        types[p.property_type] = { total: 0, occupied: 0 };
      }
      const units = p.units || [];
      types[p.property_type].total += units.length;
      types[p.property_type].occupied += units.filter((u: { status: string }) => u.status === 'occupied').length;
    });

    return Object.entries(types).map(([name, data]) => ({
      name,
      occupancy: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0,
      total: data.total,
      occupied: data.occupied,
    }));
  }, [properties]);

  const maintenanceByCategory = useMemo(() => {
    const categories: { [key: string]: number } = {};
    maintenanceRequests.forEach(r => {
      if (!categories[r.category]) categories[r.category] = 0;
      categories[r.category]++;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [maintenanceRequests]);

  const maintenanceTrend = useMemo(() => {
    const months: { [key: string]: { pending: number; completed: number } } = {};
    const numMonths = Math.max(1, differenceInMonths(effectiveDateRange.to, effectiveDateRange.from));

    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(effectiveDateRange.to, i);
      const key = format(date, 'MMM');
      months[key] = { pending: 0, completed: 0 };
    }

    maintenanceRequests.forEach(r => {
      const key = format(new Date(r.created_at), 'MMM');
      if (months[key]) {
        if (r.status === 'completed') {
          months[key].completed++;
        } else {
          months[key].pending++;
        }
      }
    });

    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  }, [maintenanceRequests, effectiveDateRange]);

  return {
    properties,
    payments,
    maintenanceRequests,
    isLoading,
    hasError,
    totalUnits,
    occupiedUnits,
    occupancyRate,
    totalRevenue,
    previousRevenue,
    revenueChange,
    pendingPayments,
    revenueData,
    occupancyByType,
    maintenanceByCategory,
    maintenanceTrend,
  };
}
