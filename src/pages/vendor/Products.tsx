import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit2, Trash2, Package, Loader2, ImageIcon, AlertTriangle, Tag, RefreshCw } from "lucide-react";
import { ProductPhotoUpload } from "@/components/vendor/ProductPhotoUpload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/currency";
import { productSchema, type ProductFormData } from "@/lib/vendorValidations";

const SERVICE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Painting",
  "AC Service",
  "Carpentry",
  "Gardening",
  "Pest Control",
  "Moving",
  "Other",
];

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unit: string;
  is_available: boolean;
  min_order: number;
  estimated_duration: string | null;
  photos: string[] | null;
  stock: number | null;
  promo_price: number | null;
  promo_start: string | null;
  promo_end: string | null;
}

interface FormErrors {
  name?: string;
  category?: string;
  price?: string;
  promo_price?: string;
  promo_dates?: string;
}

export default function VendorProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    unit: "unit",
    is_available: true,
    min_order: "1",
    estimated_duration: "",
    photos: [] as string[],
    stock: "",
    promo_price: "",
    promo_start: "",
    promo_end: "",
  });

  // Get vendor ID
  const { data: vendor } = useQuery({
    queryKey: ["vendor-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch products
  const { data: products, isLoading, error: productsError, refetch } = useQuery({
    queryKey: ["vendor-products", vendor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendor?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!vendor?.id,
  });

  // Validate form data
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Product name is required";
    } else if (formData.name.length > 100) {
      errors.name = "Product name must be less than 100 characters";
    }

    // Category validation
    if (!formData.category) {
      errors.category = "Category is required";
    }

    // Price validation
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      errors.price = "Price is required";
    } else if (price <= 0) {
      errors.price = "Price must be greater than 0";
    }

    // Promo validation
    if (formData.promo_price) {
      const promoPrice = parseFloat(formData.promo_price);
      if (promoPrice <= 0) {
        errors.promo_price = "Promo price must be greater than 0";
      } else if (promoPrice >= price) {
        errors.promo_price = "Promo price must be less than regular price";
      }

      // Validate promo dates
      if (formData.promo_start && formData.promo_end) {
        const startDate = new Date(formData.promo_start);
        const endDate = new Date(formData.promo_end);
        if (endDate <= startDate) {
          errors.promo_dates = "End date must be after start date";
        }
      } else if (!formData.promo_start || !formData.promo_end) {
        errors.promo_dates = "Both start and end dates are required for promotions";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check for active orders before delete
  const checkActiveOrdersMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .eq("product_id", productId)
        .in("status", ["pending", "confirmed", "in_progress"])
        .limit(1);
      
      if (error) throw error;
      return (data?.length || 0) > 0;
    },
  });

  // Create/Update product
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const productData = {
        vendor_id: vendor?.id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category,
        price: parseFloat(data.price),
        unit: data.unit,
        is_available: data.is_available,
        min_order: parseInt(data.min_order) || 1,
        estimated_duration: data.estimated_duration?.trim() || null,
        photos: data.photos.length > 0 ? data.photos : null,
        stock: data.stock ? parseInt(data.stock) : null,
        promo_price: data.promo_price ? parseFloat(data.promo_price) : null,
        promo_start: data.promo_start || null,
        promo_end: data.promo_end || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: editingProduct ? "Product updated successfully" : "Product created successfully" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to save product", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Clean up storage if product has photos
      const product = products?.find(p => p.id === id);
      if (product?.photos && product.photos.length > 0) {
        // Extract file paths from URLs and delete them
        const filePaths = product.photos
          .map(url => {
            const match = url.match(/\/storage\/v1\/object\/public\/([^?]+)/);
            return match ? match[1] : null;
          })
          .filter(Boolean) as string[];
        
        if (filePaths.length > 0) {
          await supabase.storage
            .from("product-photos")
            .remove(filePaths.map(p => p.replace("product-photos/", "")));
        }
      }

      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: "Product deleted successfully" });
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete product", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleOpenDialog = (product?: Product) => {
    setFormErrors({});
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        category: product.category,
        price: product.price.toString(),
        unit: product.unit,
        is_available: product.is_available,
        min_order: product.min_order.toString(),
        estimated_duration: product.estimated_duration || "",
        photos: product.photos || [],
        stock: product.stock?.toString() || "",
        promo_price: product.promo_price?.toString() || "",
        promo_start: product.promo_start ? product.promo_start.split("T")[0] : "",
        promo_end: product.promo_end ? product.promo_end.split("T")[0] : "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        unit: "unit",
        is_available: true,
        min_order: "1",
        estimated_duration: "",
        photos: [],
        stock: "",
        promo_price: "",
        promo_start: "",
        promo_end: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    saveMutation.mutate({ ...formData, id: editingProduct?.id });
  };

  const handleDeleteClick = async (product: Product) => {
    // Check for active orders
    const hasActiveOrders = await checkActiveOrdersMutation.mutateAsync(product.id);
    
    if (hasActiveOrders) {
      toast({
        title: "Cannot delete product",
        description: "This product has active orders. Complete or cancel them first.",
        variant: "destructive",
      });
      return;
    }
    
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

  // Error state
  if (productsError) {
    return (
      <VendorLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Failed to load products</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {productsError.message}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products & Services</h1>
          <p className="text-muted-foreground">Manage your products and services catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., AC Cleaning Service"
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.category && (
                    <p className="text-xs text-destructive">{formErrors.category}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your service..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (IDR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="150000"
                      min="1"
                      className={formErrors.price ? "border-destructive" : ""}
                    />
                    {formErrors.price && (
                      <p className="text-xs text-destructive">{formErrors.price}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="per unit/hour/visit"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_duration">Estimated Duration</Label>
                  <Input
                    id="estimated_duration"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                    placeholder="e.g., 2-3 hours"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity (optional)</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set stock for physical products. Leave empty for services.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Product Photos</Label>
                  <ProductPhotoUpload
                    photos={formData.photos}
                    onPhotosChange={(photos) => setFormData({ ...formData, photos })}
                    maxPhotos={5}
                  />
                </div>

                {/* Promotional Pricing Section */}
                <div className="space-y-3 p-4 rounded-lg border border-dashed">
                  <Label className="text-base font-medium">Promotional Pricing (Optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Set a discounted price for a limited time period
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="promo_price">Promo Price (IDR)</Label>
                    <Input
                      id="promo_price"
                      type="number"
                      value={formData.promo_price}
                      onChange={(e) => setFormData({ ...formData, promo_price: e.target.value })}
                      placeholder="Leave empty for no promotion"
                      min="1"
                      className={formErrors.promo_price ? "border-destructive" : ""}
                    />
                    {formErrors.promo_price && (
                      <p className="text-xs text-destructive">{formErrors.promo_price}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo_start">Start Date</Label>
                      <Input
                        id="promo_start"
                        type="date"
                        value={formData.promo_start}
                        onChange={(e) => setFormData({ ...formData, promo_start: e.target.value })}
                        disabled={!formData.promo_price}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo_end">End Date</Label>
                      <Input
                        id="promo_end"
                        type="date"
                        value={formData.promo_end}
                        onChange={(e) => setFormData({ ...formData, promo_end: e.target.value })}
                        disabled={!formData.promo_price}
                      />
                    </div>
                  </div>
                  {formErrors.promo_dates && (
                    <p className="text-xs text-destructive">{formErrors.promo_dates}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_available">Available for orders</Label>
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingProduct ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : products?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No products yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first product or service to start receiving orders
            </p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products?.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {/* Product Image */}
              {product.photos && product.photos.length > 0 ? (
                <div className="aspect-video relative bg-muted">
                  <img 
                    src={product.photos[0]} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                  {product.photos.length > 1 && (
                    <Badge variant="secondary" className="absolute bottom-2 right-2">
                      +{product.photos.length - 1} more
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {product.category}
                    </Badge>
                  </div>
                  <Badge variant={product.is_available ? "default" : "outline"}>
                    {product.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description || "No description"}
                </p>
                
                {/* Stock Warning */}
                {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
                  <Alert className="mt-2 py-2 border-warning bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-xs text-warning">
                      Low stock: {product.stock} remaining
                    </AlertDescription>
                  </Alert>
                )}
                {product.stock !== null && product.stock === 0 && (
                  <Alert className="mt-2 py-2 border-destructive bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-xs text-destructive">
                      Out of stock
                    </AlertDescription>
                  </Alert>
                )}

                {/* Promo Badge */}
                {product.promo_price && product.promo_start && product.promo_end && (
                  (() => {
                    const now = new Date();
                    const start = new Date(product.promo_start);
                    const end = new Date(product.promo_end);
                    const isActive = now >= start && now <= end;
                    
                    return isActive ? (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="destructive" className="gap-1">
                          <Tag className="h-3 w-3" />
                          Promo Active
                        </Badge>
                      </div>
                    ) : null;
                  })()
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    {product.promo_price && (() => {
                      const now = new Date();
                      const start = product.promo_start ? new Date(product.promo_start) : null;
                      const end = product.promo_end ? new Date(product.promo_end) : null;
                      const isActive = start && end && now >= start && now <= end;
                      
                      return isActive ? (
                        <>
                          <span className="text-lg font-bold text-destructive">
                            {formatCurrency(product.promo_price)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through ml-2">
                            {formatCurrency(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
                      );
                    })()}
                    {!product.promo_price && (
                      <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
                    )}
                    <span className="text-sm text-muted-foreground">/{product.unit}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(product)}
                      disabled={deleteMutation.isPending || checkActiveOrdersMutation.isPending}
                    >
                      {(deleteMutation.isPending || checkActiveOrdersMutation.isPending) && 
                       productToDelete?.id === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </VendorLayout>
  );
}