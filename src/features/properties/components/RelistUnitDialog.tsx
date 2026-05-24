import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { Home, TrendingUp, Camera } from "lucide-react";
import { Unit } from "../types";

interface RelistUnitData extends Partial<Unit> {
  monthly_rent?: number;
  is_furnished?: boolean;
  has_ac?: boolean;
  has_wifi?: boolean;
  has_water_heater?: boolean;
  type?: string;
}

interface RelistUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: RelistUnitData | null;
  onListed: () => void;
}

export function RelistUnitDialog({ open, onOpenChange, unit, onListed }: RelistUnitDialogProps) {
  const { merchant } = useAuth();
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [useExistingPhotos, setUseExistingPhotos] = useState(true);
  const [promoteUnit, setPromoteUnit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (unit) {
      setMonthlyRent(unit.monthly_rent || 0);
      setDescription(generateDescription(unit));
    }
  }, [unit]);

  if (!unit) return null;

  const suggestedRent = Math.round((unit.monthly_rent || 0) * 1.05);
  const rentChange = monthlyRent > 0 && (unit.monthly_rent || 0) > 0
    ? ((monthlyRent - (unit.monthly_rent || 0)) / (unit.monthly_rent || 1) * 100).toFixed(1)
    : 0;

  function generateDescription(unit: RelistUnitData) {
    const features = [];
    if (unit.is_furnished) features.push("Furnished");
    if (unit.has_ac) features.push("AC");
    if (unit.has_wifi) features.push("WiFi");
    if (unit.has_water_heater) features.push("Water Heater");
    return `${unit.type || "Unit"} available at ${unit.property?.name}. ${unit.size_sqm}m². ${features.join(", ")}.`;
  }

  const handleSubmit = async () => {
    if (!monthlyRent) {
      toast.error("Please enter monthly rent");
      return;
    }
    setIsSubmitting(true);
    try {
      // TODO: migrate to Go API endpoint when unit_listings endpoint is available
      // Upsert listing via API
      await apiClient.post(`/units/${unit.id}/relist`, {
        monthly_rent: monthlyRent,
        description,
        photos: useExistingPhotos ? unit.photos : [],
        promoted: promoteUnit,
        merchant_id: merchant?.id,
      });

      toast.success("Unit listed successfully");
      onListed();
    } catch (error) {
      console.error("Error listing unit:", error);
      const err = error as Error;
      toast.error(err.message || "Failed to list unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="gradient-icon-box">
              <Home className="h-5 w-5 text-primary" />
            </div>
            Re-List Unit
          </DialogTitle>
          <DialogDescription>
            {unit.property?.name} - Unit {unit.unit_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Unit Details */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-medium">{unit.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span>
                <span className="ml-2 font-medium">{unit.size_sqm}m²</span>
              </div>
              <div>
                <span className="text-muted-foreground">Previous Rent:</span>
                <span className="ml-2 font-medium">
                  Rp {(unit.monthly_rent || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Suggested:</span>
                <span className="ml-2 font-medium text-success">
                  Rp {suggestedRent.toLocaleString("id-ID")} (+5%)
                </span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <Label>Monthly Rent (Rp)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                placeholder="0"
                className="rounded-xl bg-background/60 border-border/50"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setMonthlyRent(suggestedRent)}
                className="rounded-xl"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                +5%
              </Button>
            </div>
            {Number(rentChange) !== 0 && (
              <p className={`text-sm ${Number(rentChange) > 0 ? "text-success" : "text-destructive"}`}>
                {Number(rentChange) > 0 ? "+" : ""}{rentChange}% from previous rent
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Listing Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the unit..."
              rows={4}
              className="rounded-xl bg-background/60 border-border/50"
            />
          </div>

          {/* Photos */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="use-photos"
              checked={useExistingPhotos}
              onCheckedChange={(checked) => setUseExistingPhotos(checked as boolean)}
            />
            <div>
              <Label htmlFor="use-photos" className="cursor-pointer">
                Use existing photos
              </Label>
              <p className="text-xs text-muted-foreground">
                {unit.photos?.length || 0} photos available
              </p>
            </div>
          </div>

          {/* Promotion */}
          <div className="flex items-start space-x-2 p-4 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm">
            <Checkbox
              id="promote"
              checked={promoteUnit}
              onCheckedChange={(checked) => setPromoteUnit(checked as boolean)}
            />
            <div>
              <Label htmlFor="promote" className="cursor-pointer font-medium">
                Promote this listing
              </Label>
              <p className="text-xs text-muted-foreground">
                Get higher visibility in search results
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!monthlyRent || isSubmitting}
              className="flex-1 rounded-xl gradient-cta"
            >
              {isSubmitting ? "Publishing..." : "Publish Listing"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
