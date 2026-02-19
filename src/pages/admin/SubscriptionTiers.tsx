import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { useSubscriptionStats } from "@/features/subscriptions/hooks/useSubscriptions";
import { useSubscriptionTiers } from "@/features/subscriptions/hooks/useSubscriptionTiers";
import { SubscriptionTier, SubscriptionTierInput } from "@/features/subscriptions/types/subscription-tier";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { AlertTriangle, Building2, Check, Crown, Edit2, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";

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
  const { isLoading: guardLoading } = useAdminGuard();
  const { tiers, isLoading, createTier, updateTier, deleteTier, isCreating, isUpdating, isDeleting } = useSubscriptionTiers();
  const { data: stats } = useSubscriptionStats();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<SubscriptionTier | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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
        features: tier.features ? tier.features.join("\n") : "",
        is_active: tier.is_active,
        trial_days: tier.trial_days || 14,
      });
    } else {
      setEditingTier(null);
      setFormData(defaultFormData);
    }
    setValidationError(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTier(null);
    setFormData(defaultFormData);
    setValidationError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Internal name is required";
    if (!formData.display_name.trim()) return "Display name is required";
    if (formData.price_monthly < 0) return "Monthly price cannot be negative";
    return null;
  };

  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    const featuresArray = formData.features
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f);

    const tierData: SubscriptionTierInput = {
      name: formData.name.toLowerCase().replace(/\s+/g, "_"),
      display_name: formData.display_name,
      description: formData.description || null,
      price_monthly: formData.price_monthly,
      price_yearly: formData.price_yearly || null,
      max_properties: formData.max_properties,
      max_units: formData.max_units,
      max_tenants: formData.max_tenants,
      features: featuresArray.length > 0 ? featuresArray : null,
      is_active: formData.is_active,
      trial_days: formData.trial_days || null,
    };

    if (editingTier) {
      updateTier(
        { id: editingTier.id, data: tierData },
        {
          onSuccess: handleCloseDialog,
          onError: (err) => setValidationError(err.message),
        }
      );
    } else {
      createTier(tierData, {
        onSuccess: handleCloseDialog,
        onError: (err) => setValidationError(err.message),
      });
    }
  };

  const handleDeleteClick = (tier: SubscriptionTier) => {
    setTierToDelete(tier);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tierToDelete) {
      deleteTier(tierToDelete.id, {
        onSuccess: () => {
          setDeleteConfirmOpen(false);
          setTierToDelete(null);
        },
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (guardLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Tiers</h1>
            <p className="text-muted-foreground">Manage merchant subscription packages and pricing</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Tier
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers?.map((tier) => (
            <Card key={tier.id} className={`relative flex flex-col ${!tier.is_active ? 'opacity-75 bg-muted/50' : ''}`}>
              {!tier.is_active && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="secondary">Inactive</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={tier.is_active ? "default" : "outline"} className="capitalize">
                    {tier.name.replace(/_/g, " ")}
                  </Badge>
                  {tier.name === 'enterprise' && <Crown className="h-5 w-5 text-yellow-500" />}
                  {tier.name === 'pro' && <Star className="h-5 w-5 text-primary" />}
                  {tier.name === 'starter' && <Building2 className="h-5 w-5 text-muted-foreground" />}
                </div>
                <CardTitle className="text-2xl">{tier.display_name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {tier.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      {formatCurrency(tier.price_monthly)}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {stats?.[tier.name.toLowerCase()] || 0} active
                    </Badge>
                  </div>
                  {tier.price_yearly && (
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(tier.price_yearly)}/yr (save {Math.round((1 - tier.price_yearly / (tier.price_monthly * 12)) * 100)}%)
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Up to {tier.max_properties} properties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Up to {tier.max_units} units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Up to {tier.max_tenants} tenants</span>
                  </div>
                  {tier.trial_days && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{tier.trial_days}-day free trial</span>
                    </div>
                  )}
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenDialog(tier)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(tier)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTier ? "Edit Subscription Tier" : "Create New Tier"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {validationError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {validationError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Internal Name (ID)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. starter_plan"
                  disabled={!!editingTier} // Cannot change ID of existing tier usually, but name is editable in service?
                />
                <p className="text-xs text-muted-foreground">Unique identifier, used in code</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g. Starter Plan"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the tier"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Monthly Price (IDR)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Yearly Price (IDR)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_properties">Max Properties</Label>
                <Input
                  id="max_properties"
                  type="number"
                  value={formData.max_properties}
                  onChange={(e) => setFormData({ ...formData, max_properties: Number(e.target.value) })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_units">Max Units</Label>
                <Input
                  id="max_units"
                  type="number"
                  value={formData.max_units}
                  onChange={(e) => setFormData({ ...formData, max_units: Number(e.target.value) })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_tenants">Max Tenants</Label>
                <Input
                  id="max_tenants"
                  type="number"
                  value={formData.max_tenants}
                  onChange={(e) => setFormData({ ...formData, max_tenants: Number(e.target.value) })}
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (One per line)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                className="min-h-[100px]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (Visible to users)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="trial_days">Trial Days</Label>
                <Input
                  id="trial_days"
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({ ...formData, trial_days: Number(e.target.value) })}
                  className="w-20"
                  min="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isCreating || isUpdating}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTier ? "Save Changes" : "Create Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Subscription Tier"
        description={`Are you sure you want to delete "${tierToDelete?.display_name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Tier"}
        variant="destructive"
      />
    </AdminLayout>
  );
}
