import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Star, MapPin, Phone, Mail, CalendarIcon, ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

export default function TenantVendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  });

  // Fetch vendor details
  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ["vendor-detail", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", vendorId)
        .single();
      if (error) throw error;
      return data as Vendor;
    },
    enabled: !!vendorId,
  });

  // Fetch vendor products
  const { data: products, isLoading: productsLoading } = useQuery({
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

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !user?.id) throw new Error("Invalid order");

      const totalPrice = selectedProduct.price * orderData.quantity;
      const serviceFee = totalPrice * 0.05; // 5% service fee

      const { error } = await supabase.from("orders").insert({
        tenant_user_id: user.id,
        vendor_id: vendorId,
        product_id: selectedProduct.id,
        quantity: orderData.quantity,
        unit_price: selectedProduct.price,
        total_price: totalPrice + serviceFee,
        service_fee: serviceFee,
        scheduled_date: orderData.scheduledDate ? format(orderData.scheduledDate, "yyyy-MM-dd") : null,
        scheduled_time: orderData.scheduledTime || null,
        address: orderData.address || null,
        notes: orderData.notes || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-orders"] });
      toast({ title: "Order placed successfully!" });
      setOrderDialogOpen(false);
      setSelectedProduct(null);
      setOrderData({
        quantity: 1,
        scheduledDate: undefined,
        scheduledTime: "",
        address: "",
        notes: "",
      });
      navigate("/tenant/orders");
    },
    onError: (error) => {
      toast({ title: "Failed to place order", description: error.message, variant: "destructive" });
    },
  });

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

  if (isLoading) {
    return (
      <TenantLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
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
                <span className="font-medium">{vendor.rating?.toFixed(1) || "New"}</span>
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
                  value={orderData.quantity}
                  onChange={(e) =>
                    setOrderData({ ...orderData, quantity: parseInt(e.target.value) || 1 })
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
                  onChange={(e) => setOrderData({ ...orderData, scheduledTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Address / Unit</Label>
                <Input
                  placeholder="Where should the service be done?"
                  value={orderData.address}
                  onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Any special instructions..."
                  value={orderData.notes}
                  onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                  rows={2}
                />
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
                <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>
                    {formatPrice(selectedProduct.price * orderData.quantity * 1.05)}
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
                  Confirm Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TenantLayout>
  );
}
