import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TenantLayout } from '@/components/layouts/TenantLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, FileText, DollarSign, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function TenantDashboard() {
  const { user, profile } = useAuth();

  const { data: contracts = [] } = useQuery({
    queryKey: ['tenant-contracts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('tenant_user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['tenant-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_user_id', user.id)
        .order('due_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['tenant-maintenance', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const activeMaintenanceRequests = maintenanceRequests.filter(
    r => r.status === 'pending' || r.status === 'in_progress'
  );

  return (
    <TenantLayout 
      title={`Welcome back, ${profile?.full_name || 'Tenant'}`}
      description="Manage your rental and requests"
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/tenant/maintenance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">Maintenance</p>
              {activeMaintenanceRequests.length > 0 && (
                <Badge variant="secondary" className="mt-1">
                  {activeMaintenanceRequests.length} active
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link to="/tenant/payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium">Payments</p>
              {pendingPayments.length > 0 && (
                <Badge variant="destructive" className="mt-1">
                  {pendingPayments.length} due
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link to="/tenant/contracts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium">Contracts</p>
              <Badge variant="outline" className="mt-1">
                {contracts.length}
              </Badge>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tenant/invoices">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                <Home className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium">Invoices</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{payment.payment_type}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {format(new Date(payment.due_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        R{Number(payment.amount).toLocaleString()}
                      </p>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Maintenance Requests</CardTitle>
            <Link to="/tenant/maintenance">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                New Request
              </Badge>
            </Link>
          </CardHeader>
          <CardContent>
            {maintenanceRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No requests yet</p>
            ) : (
              <div className="space-y-3">
                {maintenanceRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {request.category}
                      </p>
                    </div>
                    <Badge variant={
                      request.status === 'completed' ? 'default' :
                      request.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
}
