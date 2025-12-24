import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Users, Home, Building2, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface MerchantAnalyticsTabProps {
  merchantId: string;
}

interface Analytics {
  totalRevenue: number;
  totalTenants: number;
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  activeContracts: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  onTimePaymentRate: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function MerchantAnalyticsTab({ merchantId }: MerchantAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [merchantId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch payments (paid)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('merchant_id', merchantId)
        .eq('status', 'paid');

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Fetch properties and units
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('merchant_id', merchantId);

      const propertyIds = properties?.map(p => p.id) || [];
      
      let totalUnits = 0;
      let occupiedUnits = 0;
      
      if (propertyIds.length > 0) {
        const { data: units } = await supabase
          .from('units')
          .select('id, status')
          .in('property_id', propertyIds);
        
        totalUnits = units?.length || 0;
        occupiedUnits = units?.filter(u => u.status === 'occupied').length || 0;
      }

      // Fetch contracts
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, status, tenant_user_id')
        .eq('merchant_id', merchantId);

      const activeContracts = contracts?.filter(c => c.status === 'active').length || 0;
      const uniqueTenants = new Set(contracts?.map(c => c.tenant_user_id)).size;

      // Fetch invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, status, due_date, paid_at')
        .eq('merchant_id', merchantId);

      const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
      const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0;
      const overdueInvoices = invoices?.filter(i => 
        i.status === 'pending' && new Date(i.due_date) < new Date()
      ).length || 0;

      // Calculate on-time payment rate
      const totalPaidInvoices = invoices?.filter(i => i.status === 'paid' && i.paid_at && i.due_date) || [];
      const onTimePaid = totalPaidInvoices.filter(i => 
        new Date(i.paid_at!) <= new Date(i.due_date)
      ).length;
      const onTimePaymentRate = totalPaidInvoices.length > 0 
        ? (onTimePaid / totalPaidInvoices.length) * 100 
        : 0;

      setAnalytics({
        totalRevenue,
        totalTenants: uniqueTenants,
        totalProperties: properties?.length || 0,
        totalUnits,
        occupiedUnits,
        occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
        activeContracts,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        onTimePaymentRate,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Tidak dapat memuat data analytics
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Revenue & Tenants */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-success">{formatCurrency(analytics.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{analytics.totalTenants}</p>
                <p className="text-xs text-muted-foreground">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties & Units */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Home className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{analytics.totalProperties}</p>
                <p className="text-xs text-muted-foreground">Properties</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{analytics.occupiedUnits}/{analytics.totalUnits}</p>
                <p className="text-xs text-muted-foreground">Units Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{analytics.occupancyRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Occupancy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-success">{analytics.paidInvoices}</p>
                <p className="text-xs text-muted-foreground">Paid Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold text-warning">{analytics.pendingInvoices}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-bold text-destructive">{analytics.overdueInvoices}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* On-time Payment Rate */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">On-Time Payment Rate</p>
                <p className="text-xs text-muted-foreground">Persentase invoice dibayar tepat waktu</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${analytics.onTimePaymentRate >= 80 ? 'text-success' : analytics.onTimePaymentRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                {analytics.onTimePaymentRate.toFixed(0)}%
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${analytics.onTimePaymentRate >= 80 ? 'bg-success' : analytics.onTimePaymentRate >= 50 ? 'bg-warning' : 'bg-destructive'}`}
              style={{ width: `${analytics.onTimePaymentRate}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
