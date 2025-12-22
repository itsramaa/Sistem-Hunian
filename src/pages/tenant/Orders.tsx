import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Package, Star, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

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
  products: {
    name: string;
    category: string;
  };
  vendors: {
    business_name: string;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function TenantOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, review_text: "" });

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["tenant-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          products:product_id (name, category),
          vendors:vendor_id (business_name)
        `)
        .eq("tenant_user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user?.id,
  });

  // Check if order has been reviewed
  const { data: reviews } = useQuery({
    queryKey: ["order-reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_reviews")
        .select("order_id")
        .eq("tenant_user_id", user?.id);
      if (error) throw error;
      return data.map((r) => r.order_id);
    },
    enabled: !!user?.id,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !user?.id) throw new Error("Invalid review");

      // Get vendor_id from order
      const { data: orderData } = await supabase
        .from("orders")
        .select("vendor_id")
        .eq("id", selectedOrder.id)
        .single();

      const { error } = await supabase.from("order_reviews").insert({
        order_id: selectedOrder.id,
        tenant_user_id: user.id,
        vendor_id: orderData?.vendor_id,
        rating: reviewData.rating,
        review_text: reviewData.review_text || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-reviews"] });
      toast({ title: "Review submitted!" });
      setReviewDialogOpen(false);
      setSelectedOrder(null);
      setReviewData({ rating: 5, review_text: "" });
    },
    onError: (error) => {
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-orders"] });
      toast({ title: "Order canceled" });
    },
    onError: (error) => {
      toast({ title: "Failed to cancel", description: error.message, variant: "destructive" });
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
    setSelectedOrder(order);
    setReviewDialogOpen(true);
  };

  return (
    <TenantLayout title="My Orders" description="Track and manage your service orders">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No orders yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse the marketplace to order services
            </p>
            <Button className="mt-4" asChild>
              <a href="/tenant/marketplace">Browse Marketplace</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{order.products.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {order.vendors.business_name} • {order.order_number}
                    </p>
                  </div>
                  <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-medium">{order.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">{formatPrice(order.total_price)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ordered</p>
                    <p className="font-medium">
                      {format(new Date(order.created_at), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>

                {(order.scheduled_date || order.address) && (
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    {order.scheduled_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(order.scheduled_date), "dd MMM yyyy")}
                        {order.scheduled_time && ` at ${order.scheduled_time}`}
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

                <div className="mt-4 flex gap-2">
                  {order.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelOrderMutation.mutate(order.id)}
                      disabled={cancelOrderMutation.isPending}
                    >
                      Cancel Order
                    </Button>
                  )}
                  {order.status === "completed" && !reviews?.includes(order.id) && (
                    <Button size="sm" onClick={() => openReviewDialog(order)}>
                      <Star className="mr-2 h-4 w-4" />
                      Leave Review
                    </Button>
                  )}
                  {reviews?.includes(order.id) && (
                    <Badge variant="outline">Reviewed</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
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
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Review (optional)</Label>
              <Textarea
                placeholder="Share your experience..."
                value={reviewData.review_text}
                onChange={(e) => setReviewData({ ...reviewData, review_text: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => submitReviewMutation.mutate()}
                disabled={submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TenantLayout>
  );
}
