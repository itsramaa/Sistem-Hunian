import { useState } from 'react';
import { VendorLayout } from '@/components/layouts/VendorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Eye, 
  MapPin, 
  Calendar,
  User,
  Phone,
  MessageSquare,
  Loader2
} from 'lucide-react';

type Order = {
  id: string;
  order_number: string;
  tenant_user_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  service_fee: number | null;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  address: string | null;
  notes: string | null;
  cancel_reason: string | null;
  created_at: string;
  completed_at: string | null;
  product?: {
    name: string;
    category: string;
    unit: string | null;
  };
};

type TenantProfile = {
  full_name: string | null;
  email: string;
  phone: string | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: <CheckCircle className="h-4 w-4" /> },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: <Package className="h-4 w-4" /> },
  ready: { label: 'Ready', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300', icon: <Truck className="h-4 w-4" /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: <XCircle className="h-4 w-4" /> },
};

export default function VendorOrders() {
  const { vendor } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);

  // Fetch vendor orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['vendor-orders', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(name, category, unit)
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!vendor?.id,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, cancelReason }: { orderId: string; status: string; cancelReason?: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (status === 'cancelled' && cancelReason) {
        updateData.cancel_reason = cancelReason;
        updateData.canceled_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      if (error) throw error;

      // If completed, create vendor earning and process referral
      if (status === 'completed') {
        const order = orders.find(o => o.id === orderId);
        if (order && vendor?.id) {
          const amount = order.total_price - (order.service_fee || 0);
          const feeAmount = amount * 0.1; // 10% platform fee
          const netAmount = amount - feeAmount;

          await supabase.from('vendor_earnings').insert({
            vendor_id: vendor.id,
            vendor_job_id: orderId, // Using order ID as job reference
            amount: amount,
            fee_amount: feeAmount,
            net_amount: netAmount,
            status: 'pending',
          });

          // Trigger referral processing for vendor orders
          try {
            await supabase.functions.invoke('process-vendor-order-referral', {
              body: { order_id: orderId, vendor_id: vendor.id },
            });
          } catch (referralError) {
            console.error('Referral processing error:', referralError);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast.success('Order status updated');
      setDetailsOpen(false);
      setCancelDialogOpen(false);
      setCancelReason('');
    },
    onError: () => {
      toast.error('Failed to update order');
    },
  });

  // Fetch tenant profile when viewing details
  const fetchTenantProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('user_id', userId)
      .single();
    setTenantProfile(data as TenantProfile | null);
  };

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
    await fetchTenantProfile(order.tenant_user_id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'processing',
      processing: 'ready',
      ready: 'completed',
    };
    return flow[currentStatus] || null;
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => ['confirmed', 'processing', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const stats = {
    pending: pendingOrders.length,
    active: activeOrders.length,
    completed: completedOrders.length,
    todayRevenue: orders
      .filter(o => o.status === 'completed' && o.completed_at && new Date(o.completed_at).toDateString() === new Date().toDateString())
      .reduce((sum, o) => sum + o.total_price, 0),
  };

  const OrdersTable = ({ ordersList }: { ordersList: Order[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordersList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No orders found
            </TableCell>
          </TableRow>
        ) : (
          ordersList.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.product?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{order.product?.category}</p>
                  </div>
                </TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell className="font-medium">{formatPrice(order.total_price)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{format(new Date(order.created_at), 'dd MMM yyyy')}</p>
                    {order.scheduled_date && (
                      <p className="text-xs text-muted-foreground">
                        Scheduled: {format(new Date(order.scheduled_date), 'dd MMM')}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={config.color}>
                    <span className="mr-1">{config.icon}</span>
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders from the marketplace</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.todayRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending {stats.pending > 0 && <Badge variant="destructive">{stats.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="active">
              <Package className="h-4 w-4 mr-2" />
              Active ({stats.active})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              <XCircle className="h-4 w-4 mr-2" />
              Cancelled ({cancelledOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Orders</CardTitle>
                <CardDescription>Orders waiting for your confirmation</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <OrdersTable ordersList={pendingOrders} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Orders</CardTitle>
                <CardDescription>Orders being processed</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersTable ordersList={activeOrders} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Orders</CardTitle>
                <CardDescription>Successfully fulfilled orders</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersTable ordersList={completedOrders} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled">
            <Card>
              <CardHeader>
                <CardTitle>Cancelled Orders</CardTitle>
                <CardDescription>Orders that were cancelled</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersTable ordersList={cancelledOrders} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                {selectedOrder?.order_number}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={statusConfig[selectedOrder.status]?.color || ''}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>

                {/* Product Info */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedOrder.product?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.quantity} x {formatPrice(selectedOrder.unit_price)}
                  </p>
                  <p className="text-lg font-semibold mt-2">
                    Total: {formatPrice(selectedOrder.total_price)}
                  </p>
                </div>

                {/* Customer Info */}
                {tenantProfile && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>{tenantProfile.full_name || 'No name'}</p>
                      <p className="text-muted-foreground">{tenantProfile.email}</p>
                      {tenantProfile.phone && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {tenantProfile.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule */}
                {(selectedOrder.scheduled_date || selectedOrder.scheduled_time) && (
                  <div className="space-y-1">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Schedule
                    </h4>
                    <p className="text-sm">
                      {selectedOrder.scheduled_date && format(new Date(selectedOrder.scheduled_date), 'EEEE, dd MMMM yyyy')}
                      {selectedOrder.scheduled_time && ` at ${selectedOrder.scheduled_time}`}
                    </p>
                  </div>
                )}

                {/* Address */}
                {selectedOrder.address && (
                  <div className="space-y-1">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </h4>
                    <p className="text-sm">{selectedOrder.address}</p>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="space-y-1">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Notes
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Cancel Reason */}
                {selectedOrder.cancel_reason && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Cancel Reason:</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{selectedOrder.cancel_reason}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDetailsOpen(false);
                        setCancelDialogOpen(true);
                      }}
                    >
                      Cancel Order
                    </Button>
                    {getNextStatus(selectedOrder.status) && (
                      <Button
                        onClick={() => updateStatusMutation.mutate({
                          orderId: selectedOrder.id,
                          status: getNextStatus(selectedOrder.status)!,
                        })}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Mark as {statusConfig[getNextStatus(selectedOrder.status)!]?.label}
                      </Button>
                    )}
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Reason for cancellation (required)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                  Keep Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedOrder && cancelReason.trim()) {
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: 'cancelled',
                        cancelReason: cancelReason,
                      });
                    }
                  }}
                  disabled={!cancelReason.trim() || updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VendorLayout>
  );
}