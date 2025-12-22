import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Crown, Star, Building2, Loader2, Check, GripVertical } from "lucide-react";

interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  max_properties: number;
  max_units: number;
  max_tenants: number;
  features: string[] | null;
  is_active: boolean;
  trial_days: number | null;
  sort_order: number;
}

const defaultFormData = {
  name: "",
  display_name: "",
  description: "",
  price_monthly: 0,
  price_yearly: 0,
  max_properties: 1,
  max_units: 5,
  max_tenants: 5,
  features: "",
  is_active: true,
  trial_days: 14,
};

export default function AdminSubscriptionTiers() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["subscription-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as SubscriptionTier[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const featuresArray = data.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f);

      const tierData = {
        name: data.name.toLowerCase().replace(/\s+/g, "_"),
        display_name: data.display_name,
        description: data.description || null,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly || null,
        max_properties: data.max_properties,
        max_units: data.max_units,
        max_tenants: data.max_tenants,
        features: featuresArray.length > 0 ? featuresArray : null,
        is_active: data.is_active,
        trial_days: data.trial_days || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("subscription_tiers")
          .update(tierData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscription_tiers").insert({
          ...tierData,
          sort_order: (tiers?.length || 0) + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-tiers"] });
      toast.success(editingTier ? "Tier updated" : "Tier created");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save tier");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscription_tiers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-tiers"] });
      toast.success("Tier deleted");
    },
    onError: () => toast.error("Failed to delete tier"),
  });

  const handleOpenDialog = (tier?: SubscriptionTier) => {
    if (tier) {
      setEditingTier(tier);
      setFormData({
        name: tier.name,
        display_name: tier.display_name,
        description: tier.description || "",
        price_monthly: tier.price_monthly,
        price_yearly: tier.price_yearly || 0,
        max_properties: tier.max_properties,
        max_units: tier.max_units,
        max_tenants: tier.max_tenants,
        features: Array.isArray(tier.features) ? tier.features.join("\n") : "",
        is_active: tier.is_active,
        trial_days: tier.trial_days || 14,
      });
    } else {
      setEditingTier(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTier(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingTier?.id });
  };

  const getTierIcon = (name: string) => {
    switch (name) {
      case "enterprise":
        return <Crown className="h-6 w-6 text-accent" />;
      case "pro":
        return <Star className="h-6 w-6 text-primary" />;
      default:
        return <Building2 className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscription Tiers</h1>
            <p className="text-muted-foreground">Manage subscription plans and pricing</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tier
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tiers?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Crown className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No subscription tiers</h3>
              <p className="text-muted-foreground mb-4">Create your first subscription tier</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tiers?.map((tier) => (
              <Card key={tier.id} className={`relative ${!tier.is_active ? "opacity-60" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTierIcon(tier.name)}
                      <div>
                        <CardTitle className="text-lg">{tier.display_name}</CardTitle>
                        {!tier.is_active && (
                          <Badge variant="outline" className="mt-1">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(tier)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(tier.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">{formatPrice(tier.price_monthly)}</p>
                    <p className="text-sm text-muted-foreground">/month</p>
                    {tier.price_yearly && (
                      <p className="text-xs text-muted-foreground mt-1">
                        or {formatPrice(tier.price_yearly)}/year
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Properties</span>
                      <span className="font-medium">{tier.max_properties}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Units</span>
                      <span className="font-medium">{tier.max_units}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tenants</span>
                      <span className="font-medium">{tier.max_tenants}</span>
                    </div>
                    {tier.trial_days && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Trial</span>
                        <span className="font-medium">{tier.trial_days} days</span>
                      </div>
                    )}
                  </div>

                  {tier.features && Array.isArray(tier.features) && tier.features.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">Features</p>
                      <ul className="space-y-1">
                        {tier.features.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-success" />
                            {feature}
                          </li>
                        ))}
                        {tier.features.length > 5 && (
                          <li className="text-xs text-muted-foreground">
                            +{tier.features.length - 5} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTier ? "Edit Tier" : "Create Tier"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Internal Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., pro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="e.g., Professional"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price (IDR)</Label>
                  <Input
                    type="number"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yearly Price (IDR)</Label>
                  <Input
                    type="number"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Properties</Label>
                  <Input
                    type="number"
                    value={formData.max_properties}
                    onChange={(e) => setFormData({ ...formData, max_properties: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Units</Label>
                  <Input
                    type="number"
                    value={formData.max_units}
                    onChange={(e) => setFormData({ ...formData, max_units: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Tenants</Label>
                  <Input
                    type="number"
                    value={formData.max_tenants}
                    onChange={(e) => setFormData({ ...formData, max_tenants: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Trial Days</Label>
                <Input
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  rows={5}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTier ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
