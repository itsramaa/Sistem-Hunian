import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { TenantLayout } from "@/shared/components/layouts/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Loader2, Package, Star, Calendar, MapPin, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { CardSkeleton } from "@/shared/components/ui/skeletons";
import { format } from "date-fns";
import { useOrderTracking } from "@/features/analytics/hooks/useAnalytics";

interface Order {
  id: string;
  order_number: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  vendor_id: string;
  products: {
    name: string;
    category: string;
  };
  vendors: {
    business_name: string;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  in_progress: "Diproses",
  completed: "Selesai",
  canceled: "Dibatalkan",
  refunded: "Dikembalikan",
};

// Only pending orders can be cancelled
const CANCELLABLE_STATUSES = ["pending"];
// Only completed orders can be reviewed (not refunded)
const REVIEWABLE_STATUSES = ["completed"];
const MAX_REVIEW_LENGTH = 1000;

export default function TenantOrders() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trackOrderCancelled } = useOrderTracking();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, review_text: "" });
  const [cancelReason, setCancelReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Tenant role verification
  const isTenant = role === 'tenant';

  // Fetch orders
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ["tenant-orders", user?.id],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/orders', { params: { tenant_user_id: user?.id } });
        return r.data as Order[];
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user?.id,
  });

  // Check if order has been reviewed
  const { data: reviews } = useQuery({
    queryKey: ["order-reviews", user?.id],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/order-reviews', { params: { tenant_user_id: user?.id, fields: 'order_id' } });
        return (r.data as { order_id: string }[]).map((rv) => rv.order_id);
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user?.id,
  });

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders?.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  // Submit review mutation with validation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !user?.id) throw new Error("Data tidak valid");

      // Validate order is reviewable
      if (!REVIEWABLE_STATUSES.includes(selectedOrder.status)) {
        throw new Error("Pesanan tidak dapat direview");
      }

      // Check if already reviewed
      if (reviews?.includes(selectedOrder.id)) {
        throw new Error("Pesanan sudah direview");
      }

      // Validate review text length
      if (reviewData.review_text.length > MAX_REVIEW_LENGTH) {
        throw new Error(`Review maksimal ${MAX_REVIEW_LENGTH} karakter`);
      }

      await apiClient.post('/order-reviews', {
        order_id: selectedOrder.id,
        tenant_user_id: user.id,
        vendor_id: selectedOrder.vendor_id,
        rating: reviewData.rating,
        review_text: reviewData.review_text.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-reviews"] });
      toast({ title: "Review berhasil dikirim!" });
      setReviewDialogOpen(false);
      setSelectedOrder(null);
      setReviewData({ rating: 5, review_text: "" });
    },
    onError: (error) => {
      toast({ title: "Gagal mengirim review", description: error.message, variant: "destructive" });
    },
  });

  // Cancel order mutation with validation
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error("Data tidak valid");
      
      // Validate order can be cancelled
      if (!CANCELLABLE_STATUSES.includes(selectedOrder.status)) {
        throw new Error("Pesanan tidak dapat dibatalkan karena sudah diproses");
      }

      await apiClient.put('/orders/' + selectedOrder.id, { 
        status: "canceled", 
        canceled_at: new Date().toISOString(),
        notes: cancelReason ? `Alasan pembatalan: ${cancelReason}` : selectedOrder.notes
      });
      return selectedOrder.id;
    },
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-orders"] });
      trackOrderCancelled(orderId, cancelReason || "User requested cancellation");
      toast({ title: "Pesanan dibatalkan" });
      setCancelDialogOpen(false);
      setSelectedOrder(null);
      setCancelReason("");
    },
    onError: (error) => {
      toast({ title: "Gagal membatalkan", description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const openReviewDialog = (order: Order) => {
    if (!REVIEWABLE_STATUSES.includes(order.status)) {
      toast({ title: "Tidak dapat review", description: "Pesanan belum selesai atau sudah direfund", variant: "destructive" });
      return;
    }
    setSelectedOrder(order);
    setReviewDialogOpen(true);
  };

  const openCancelDialog = (order: Order) => {
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      toast({ title: "Tidak dapat dibatalkan", description: "Pesanan sudah diproses dan tidak dapat dibatalkan", variant: "destructive" });
      return;
    }
    setSelectedOrder(order);
    setCancelDialogOpen(true);
  };

  // Not a tenant
  if (!isTenant) {
    return (
      <TenantLayout title="Pesanan Saya">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Akses ditolak. Halaman ini hanya untuk tenant.</AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout title="Pesanan Saya" description="Lacak dan kelola pesanan layanan Anda">
      {/* Status Filter */}
      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
            <SelectItem value="in_progress">Diproses</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="canceled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Gagal memuat pesanan.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredOrders?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Belum ada pesanan</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Jelajahi marketplace untuk memesan layanan
            </p>
            <Button className="mt-4" asChild>
              <a href="/tenant/marketplace">Jelajahi Marketplace</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders?.map((order) => (
            <Collapsible
              key={order.id}
              open={expandedOrderId === order.id}
              onOpenChange={(open) => setExpandedOrderId(open ? order.id : null)}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{order.products?.name || 'Produk'}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {order.vendors?.business_name || 'Vendor'} • {order.order_number || '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[order.status] || ""}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {expandedOrderId === order.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Jumlah</p>
                      <p className="font-medium">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium">{formatPrice(order.total_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dipesan</p>
                      <p className="font-medium">
                        {format(new Date(order.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <CollapsibleContent className="mt-4 space-y-3 border-t pt-4">
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground">Harga Satuan</p>
                        <p className="font-medium">{formatPrice(order.unit_price)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kategori</p>
                        <p className="font-medium">{order.products?.category || '-'}</p>
                      </div>
                    </div>

                    {(order.scheduled_date || order.address) && (
                      <div className="flex flex-wrap gap-4 text-sm">
                        {order.scheduled_date && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(order.scheduled_date), "dd MMM yyyy")}
                            {order.scheduled_time && ` pukul ${order.scheduled_time}`}
                          </div>
                        )}
                        {order.address && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {order.address}
                          </div>
                        )}
                      </div>
                    )}

                    {order.notes && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Catatan</p>
                        <p>{order.notes}</p>
                      </div>
                    )}

                    {order.completed_at && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Selesai pada</p>
                        <p className="font-medium">{format(new Date(order.completed_at), "dd MMM yyyy HH:mm")}</p>
                      </div>
                    )}
                  </CollapsibleContent>

                  <div className="mt-4 flex gap-2">
                    {CANCELLABLE_STATUSES.includes(order.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCancelDialog(order)}
                        disabled={cancelOrderMutation.isPending}
                      >
                        Batalkan
                      </Button>
                    )}
                    {REVIEWABLE_STATUSES.includes(order.status) && !reviews?.includes(order.id) && (
                      <Button size="sm" onClick={() => openReviewDialog(order)}>
                        <Star className="mr-2 h-4 w-4" />
                        Beri Review
                      </Button>
                    )}
                    {reviews?.includes(order.id) && (
                      <Badge variant="outline">Sudah Direview</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Batalkan Pesanan?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alasan Pembatalan (opsional)</Label>
              <Textarea
                placeholder="Jelaskan alasan pembatalan..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelOrderMutation.mutate()}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Batalkan Pesanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Beri Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Review (opsional, max {MAX_REVIEW_LENGTH} karakter)</Label>
              <Textarea
                placeholder="Bagikan pengalaman Anda..."
                value={reviewData.review_text}
                onChange={(e) => setReviewData({ ...reviewData, review_text: e.target.value.slice(0, MAX_REVIEW_LENGTH) })}
                rows={3}
                maxLength={MAX_REVIEW_LENGTH}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reviewData.review_text.length}/{MAX_REVIEW_LENGTH}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReviewDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={() => submitReviewMutation.mutate()}
                disabled={submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Kirim Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TenantLayout>
  );
}
