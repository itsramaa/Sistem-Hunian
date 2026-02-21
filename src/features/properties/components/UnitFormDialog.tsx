import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { UnitPhotoUpload } from "./UnitPhotoUpload";
import { unitSchema, UnitFormData } from "../types/schema";
import { Unit, Property } from "../types";
import { getUnitTypesForProperty, MAX_REASONABLE_SIZE } from "../utils/unit-utils";

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit | null;
  properties: Property[];
  onSubmit: (data: UnitFormData) => Promise<void>;
  isLoading: boolean;
}

export const UnitFormDialog = ({
  open,
  onOpenChange,
  unit,
  properties,
  onSubmit,
  isLoading
}: UnitFormDialogProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      property_id: "",
      unit_number: "",
      unit_type: "apartment",
      floor: null,
      size_sqm: null,
      rent_amount: 0,
      deposit_amount: null,
      status: "available",
      description: "",
      photos: [],
    },
  });

  const selectedPropertyId = watch("property_id");
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const status = watch("status");

  useEffect(() => {
    if (unit) {
      reset({
        property_id: unit.property_id,
        unit_number: unit.unit_number,
        unit_type: unit.unit_type || "apartment",
        floor: unit.floor,
        size_sqm: unit.size_sqm,
        rent_amount: unit.rent_amount,
        deposit_amount: unit.deposit_amount,
        status: unit.status as any,
        description: unit.description,
        photos: unit.photos || [],
      });
    } else {
      reset({
        property_id: "",
        unit_number: "",
        unit_type: "apartment",
        floor: null,
        size_sqm: null,
        rent_amount: 0,
        deposit_amount: null,
        status: "available",
        description: "",
        photos: [],
      });
    }
  }, [unit, reset, open]);

  const handleFormSubmit = async (data: UnitFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label>Property *</Label>
            <Select 
              value={watch("property_id")} 
              onValueChange={(value) => setValue("property_id", value, { shouldValidate: true })}
            >
              <SelectTrigger className={errors.property_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property_id && (
              <p className="text-sm text-destructive">{errors.property_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Number *</Label>
              <Input
                {...register("unit_number")}
                placeholder="e.g., A101"
                className={errors.unit_number ? 'border-destructive' : ''}
              />
              {errors.unit_number && (
                <p className="text-sm text-destructive">{errors.unit_number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Unit Type</Label>
              <Select 
                value={watch("unit_type")} 
                onValueChange={(value) => setValue("unit_type", value, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.unit_type ? 'border-destructive' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getUnitTypesForProperty(selectedProperty?.property_type).map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit_type && (
                <p className="text-sm text-destructive">{errors.unit_type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Floor</Label>
              <Input
                type="number"
                min="0"
                {...register("floor")}
                placeholder="Floor number"
                className={errors.floor ? 'border-destructive' : ''}
              />
              {errors.floor && (
                <p className="text-sm text-destructive">{errors.floor.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Size (sqm)</Label>
              <Input
                type="number"
                min="0"
                max={MAX_REASONABLE_SIZE}
                {...register("size_sqm")}
                placeholder="Size in sqm"
                className={errors.size_sqm ? 'border-destructive' : ''}
              />
              {errors.size_sqm && (
                <p className="text-sm text-destructive">{errors.size_sqm.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monthly Rent *</Label>
              <Input
                type="number"
                min="0"
                {...register("rent_amount")}
                placeholder="Rent amount"
                className={errors.rent_amount ? 'border-destructive' : ''}
              />
              {errors.rent_amount && (
                <p className="text-sm text-destructive">{errors.rent_amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Deposit Amount</Label>
              <Input
                type="number"
                min="0"
                {...register("deposit_amount")}
                placeholder="Deposit amount"
                className={errors.deposit_amount ? 'border-destructive' : ''}
              />
              {errors.deposit_amount && (
                <p className="text-sm text-destructive">{errors.deposit_amount.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={watch("status")} 
              onValueChange={(value: any) => setValue("status", value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
            {status === 'occupied' && !unit && (
              <p className="text-xs text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Setting as occupied manually. Consider creating a contract instead.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              {...register("description")}
              placeholder="Unit description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Photos</Label>
            <UnitPhotoUpload
              photos={watch("photos")}
              onPhotosChange={(photos) => setValue("photos", photos)}
              maxPhotos={10}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {unit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
