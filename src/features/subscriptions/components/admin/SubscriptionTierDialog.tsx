import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { SubscriptionTier, SubscriptionTierInput } from "@/features/subscriptions/types/subscription-tier";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SubscriptionTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: SubscriptionTier | null;
  onSubmit: (data: SubscriptionTierInput) => void;
  isLoading: boolean;
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

export function SubscriptionTierDialog({
  open,
  onOpenChange,
  tier,
  onSubmit,
  isLoading,
}: SubscriptionTierDialogProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (tier) {
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
        setFormData(defaultFormData);
      }
      setValidationError(null);
    }
  }, [open, tier]);

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

    onSubmit(tierData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tier ? "Edit Subscription Tier" : "Create New Tier"}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {validationError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-center gap-2">
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
                disabled={!!tier} 
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tier ? "Save Changes" : "Create Tier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
