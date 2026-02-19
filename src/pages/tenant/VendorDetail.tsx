import { useAuth } from "@/features/auth/hooks/useAuth";
import { XenditPaymentModal } from "@/features/payments/components/XenditPaymentModal";
import { supabase } from "@/lib/integrations/supabase/client";
import { TenantLayout } from "@/shared/components/layouts/TenantLayout";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/utils/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, CalendarIcon, Check, CreditCard, Loader2, Mail, MapPin, MessageSquare, Phone, RefreshCw, ShoppingCart, Star, Tag, X } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unit: string;
  estimated_duration: string | null;
  is_available: boolean;
}

interface Vendor {
  id: string;
  business_name: string;
  description: string | null;
  service_categories: string[] | null;
  rating: number | null;
  total_jobs: number | null;
  city: string | null;
  province: string | null;
  contact_email: string;
  contact_phone: string | null;
}

interface VendorReview {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

// Max lengths for validation
const MAX_ADDRESS_LENGTH = 200;
const MAX_NOTES_LENGTH = 500;

export default function TenantVendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderData, setOrderData] = useState({
    quantity: 1,
    scheduledDate: undefined as Date | undefined,
    scheduledTime: "",
    address: "",
    notes: "",
    voucherCode: "",
  });
  const [voucherDiscount, setVoucherDiscount] = useState<{ id: string; amount: number } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; total: number } | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Fetch vendor details
  const { data: vendor, isLoading: vendorLoading, error: vendorError, refetch: refetchVendor } = useQuery({
    queryKey: ["vendor-detail", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", vendorId)
        .eq("verification_status", "verified")
        .single();
      if (error) throw error;
      return data as Vendor;
    },
    enabled: !!vendorId,
  });

  // Fetch vendor products
  const { data: products, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ["vendor-products-public", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("is_available", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!vendorId,
  });

  // Fetch vendor reviews (from maintenance_reviews)
  const { data: reviews } = useQuery({
    queryKey: ["vendor-reviews", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_reviews")
        .select("id, rating, review_text, created_at")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as VendorReview[];
    },
    enabled: !!vendorId,
  });

  // Create order mutation with escrow integration and voucher support
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !user?.id) throw new Error("Invalid order");

      // Validate inputs
      if (orderData.quantity < 1 || orderData.quantity > 100) {
        throw new Error("Quantity must be between 1 and 100");
      }
      if (orderData.address.length > MAX_ADDRESS_LENGTH) {
        throw new Error(`Address must be less than ${MAX_ADDRESS_LENGTH} characters`);
      }
      if (orderData.notes.length > MAX_NOTES_LENGTH) {
        throw new Error(`Notes must be less than ${MAX_NOTES_LENGTH} characters`);
      }

      const totalPrice = selectedProduct.price * orderData.quantity;
      const serviceFee = totalPrice * 0.05; // 5% service fee
      const discountAmount = voucherDiscount?.amount || 0;
      const finalTotal = Math.max(totalPrice + serviceFee - discountAmount, 0);

      // Create the order
      const { data: orderData2, error: orderError } = await supabase.from("orders").insert([{
        order_number: `ORD${Date.now()}`,
        tenant_user_id: user.id,
        vendor_id: vendorId!,
        product_id: selectedProduct.id,
        quantity: orderData.quantity,
        unit_price: selectedProduct.price,
        total_price: finalTotal,
        service_fee: serviceFee,
        scheduled_date: orderData.scheduledDate ? format(orderData.scheduledDate, "yyyy-MM-dd") : null,
        scheduled_time: orderData.scheduledTime.slice(0, 20) || null,
        address: orderData.address.slice(0, MAX_ADDRESS_LENGTH) || null,
        notes: orderData.notes ? `${orderData.notes.slice(0, MAX_NOTES_LENGTH)}${voucherDiscount ? ` | Voucher: ${orderData.voucherCode} (-${discountAmount})` : ''}` : null,
        status: "pending",
      }]).select().single();
      
      if (orderError) throw orderError;

      // Mark voucher as used if applied
      if (voucherDiscount) {
        await supabase
          .from("referral_rewards")
          .update({ used_at: new Date().toISOString(), status: "used" })
          .eq("id", voucherDiscount.id);
      }
      
      return { id: orderData2.id, total: finalTotal, orderId: orderData2.id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-orders"] });
      setOrderDialogOpen(false);
      setCreatedOrder(data);
      setPaymentModalOpen(true);
      toast({ title: "Order created! Proceeding to payment..." });
    },
    onError: (error) => {
      toast({ title: "Failed to place order", description: error.message, variant: "destructive" });
    },
  });

  const handlePaymentComplete = () => {
    setPaymentModalOpen(false);
    setCreatedOrder(null);
    setSelectedProduct(null);
    setOrderData({
      quantity: 1,
      scheduledDate: undefined,
      scheduledTime: "",
      address: "",
      notes: "",
      voucherCode: "",
    });
    setVoucherDiscount(null);
    setVoucherError(null);
    navigate("/tenant/orders");
  };

  // Validate voucher code
  const validateVoucher = async (code: string) => {
    if (!code.trim() || !user?.id) {
      setVoucherDiscount(null);
      setVoucherError(null);
      return;
    }

    setVoucherLoading(true);
    setVoucherError(null);
    
    try {
      // Find active referral reward with type order_discount for this user
      const { data: reward, error } = await supabase
        .from("referral_rewards")
        .select("id, amount, status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "credited")
        .or("type.eq.order_discount,type.eq.subscription_credit")
        .is("used_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // Also check for referral by code
      const { data: referral } = await supabase
        .from("referrals")
        .select("id, reward_amount")
        .eq("referral_code", code.toUpperCase())
        .eq("referee_user_id", user.id)
        .eq("status", "completed")
        .eq("reward_paid", false)
        .maybeSingle();

      if (reward) {
        // Check expiry
        if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
          setVoucherError("This voucher has expired");
          setVoucherDiscount(null);
        } else {
          setVoucherDiscount({ id: reward.id, amount: reward.amount });
        }
      } else if (referral && referral.reward_amount) {
        // Use referral reward
        setVoucherDiscount({ id: referral.id, amount: referral.reward_amount });
      } else {
        setVoucherError("Invalid or already used voucher code");
        setVoucherDiscount(null);
      }
    } catch (err) {
      setVoucherError("Failed to validate voucher");
      setVoucherDiscount(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleOrderClick = (product: Product) => {
    setSelectedProduct(product);
    setOrderDialogOpen(true);
  };

  const isLoading = vendorLoading || productsLoading;
  const hasError = vendorError || productsError;

  // Role verification
  if (role && role !== "tenant") {
    return <Navigate to="/unauthorized" replace />;
  }

  if (isLoading) {
    return (
      <TenantLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </TenantLayout>
    );
  }

  if (hasError) {
    return (
      <TenantLayout title="Error">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Gagal memuat data vendor. Silakan coba lagi.</span>
            <Button variant="outline" size="sm" onClick={() => { refetchVendor(); refetchProducts(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  if (!vendor) {
    return (
      <TenantLayout title="Vendor not found">
        <Card>
          <CardContent className="py-12 text-center">
            <p>Vendor not found or no longer available.</p>
            <Button className="mt-4" onClick={() => navigate("/tenant/marketplace")}>
              Back to Marketplace
            </Button>
          </CardContent>
        </Card>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout
      title={vendor.business_name}
      description="View services and place orders"
      actions={
        <Button variant="outline" onClick={() => navigate("/tenant/marketplace")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      {/* Vendor Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{vendor.business_name}</h2>
              {vendor.city && (
                <div className="mt-1 flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-1 h-4 w-4" />
                  {vendor.city}
                  {vendor.province && `, ${vendor.province}`}
                </div>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {vendor.description || "Professional service provider"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {vendor.service_categories?.map((cat) => (
                  <Badge key={cat} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{vendor.rating ? vendor.rating.toFixed(1) : "—"}</span>
                <span className="text-muted-foreground">
                  ({vendor.total_jobs || 0} jobs)
                </span>
              </div>
              {vendor.contact_email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {vendor.contact_email}
                </div>
              )}
              {vendor.contact_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {vendor.contact_phone}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Reviews Section */}
      {reviews && reviews.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "h-3 w-3",
                          i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        )} 
                      />
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "dd MMM yyyy")}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="mt-1 text-sm text-muted-foreground">{review.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <h3 className="mb-4 text-lg font-semibold">Available Services</h3>
      {products?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No services available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products?.map((product) => (
            <Card key={product.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{product.name}</CardTitle>
                <Badge variant="secondary" className="w-fit">
                  {product.category}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description || "No description"}
                </p>
                {product.estimated_duration && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Duration: {product.estimated_duration}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{formatPrice(product.price)}</p>
                    <p className="text-xs text-muted-foreground">per {product.unit}</p>
                  </div>
                  <Button onClick={() => handleOrderClick(product)}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(selectedProduct.price)} per {selectedProduct.unit}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={orderData.quantity}
                  onChange={(e) =>
                    setOrderData({ ...orderData, quantity: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !orderData.scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {orderData.scheduledDate
                        ? format(orderData.scheduledDate, "PPP")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={orderData.scheduledDate}
                      onSelect={(date) => setOrderData({ ...orderData, scheduledDate: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <Input
                  placeholder="e.g., 10:00 AM"
                  value={orderData.scheduledTime}
                  onChange={(e) => setOrderData({ ...orderData, scheduledTime: e.target.value.slice(0, 20) })}
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label>Address / Unit</Label>
                <Input
                  placeholder="Where should the service be done?"
                  value={orderData.address}
                  onChange={(e) => setOrderData({ ...orderData, address: e.target.value.slice(0, MAX_ADDRESS_LENGTH) })}
                  maxLength={MAX_ADDRESS_LENGTH}
                />
                <p className="text-xs text-muted-foreground">{orderData.address.length}/{MAX_ADDRESS_LENGTH}</p>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Any special instructions..."
                  value={orderData.notes}
                  onChange={(e) => setOrderData({ ...orderData, notes: e.target.value.slice(0, MAX_NOTES_LENGTH) })}
                  rows={2}
                  maxLength={MAX_NOTES_LENGTH}
                />
                <p className="text-xs text-muted-foreground">{orderData.notes.length}/{MAX_NOTES_LENGTH}</p>
              </div>

              {/* Voucher Code Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Voucher Code (optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter voucher code"
                    value={orderData.voucherCode}
                    onChange={(e) => {
                      setOrderData({ ...orderData, voucherCode: e.target.value.toUpperCase().slice(0, 20) });
                      setVoucherDiscount(null);
                      setVoucherError(null);
                    }}
                    maxLength={20}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => validateVoucher(orderData.voucherCode)}
                    disabled={voucherLoading || !orderData.voucherCode.trim()}
                  >
                    {voucherLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {voucherDiscount && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Voucher applied! {formatPrice(voucherDiscount.amount)} discount
                  </div>
                )}
                {voucherError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <X className="h-4 w-4" />
                    {voucherError}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-muted p-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedProduct.price * orderData.quantity)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Service fee (5%)</span>
                  <span>{formatPrice(selectedProduct.price * orderData.quantity * 0.05)}</span>
                </div>
                {voucherDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Voucher Discount</span>
                    <span>-{formatPrice(voucherDiscount.amount)}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>
                    {formatPrice(
                      Math.max(
                        selectedProduct.price * orderData.quantity * 1.05 - (voucherDiscount?.amount || 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOrderDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => createOrderMutation.mutate()}
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <CreditCard className="mr-2 h-4 w-4" />
                  Order & Pay
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Xendit Payment Modal for Order */}
      {createdOrder && user && (
        <XenditPaymentModal
          open={paymentModalOpen}
          onOpenChange={(open) => {
            if (!open) handlePaymentComplete();
          }}
          amount={createdOrder.total}
          description={`Order ${selectedProduct?.name || 'Service'}`}
          orderId={createdOrder.id}
          payerEmail={user.email || ''}
          payerName={user.user_metadata?.full_name || 'Tenant'}
          userId={user.id}
          paymentType="order"
        />
      )}
    </TenantLayout>
  );
}
