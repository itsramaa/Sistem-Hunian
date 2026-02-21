import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { z } from "zod";
import { Property } from "../types";
import { PROPERTY_TYPES } from "../constants";
import { ProvincesCitiesSelect } from "./ProvincesCitiesSelect";
import { LocationPicker } from "./LocationPicker";
import { UnitPhotoUpload } from "./UnitPhotoUpload";
import { CustomAmenities } from "./CustomAmenities";

const propertySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  property_type: z.enum(['kost', 'apartment', 'house', 'kontrakan', 'ruko']),
  address: z.string().min(5, 'Address is required').max(255),
  city: z.string().min(2, 'City is required').max(100),
  province: z.string().min(2, 'Province is required').max(100),
  postal_code: z.string().max(10).optional(),
  description: z.string().max(1000).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  isLoading: boolean;
}

export function PropertyFormDialog({
  open,
  onOpenChange,
  property,
  onSubmit,
  isLoading
}: PropertyFormDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      property_type: 'kost',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      description: '',
      amenities: [],
      images: [],
    },
  });

  useEffect(() => {
    if (property) {
      reset({
        name: property.name,
        property_type: property.property_type,
        address: property.address,
        city: property.city,
        province: property.province,
        postal_code: property.postal_code || '',
        description: property.description || '',
        amenities: property.amenities || [],
        images: property.images || [],
      });
    } else {
      reset({
        name: '',
        property_type: 'kost',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        description: '',
        amenities: [],
        images: [],
      });
    }
  }, [property, reset, open]);

  const handleFormSubmit = async (data: PropertyFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add New Property'}</DialogTitle>
          <DialogDescription>
            {property ? 'Update property details' : 'Add a new rental property to your portfolio'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nama Properti</Label>
              <Input
                id="name"
                placeholder="Contoh: Kost Harmoni"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="property_type">Tipe Properti</Label>
              <Select 
                value={watch('property_type')} 
                onValueChange={(value: any) => setValue('property_type', value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Province & City Dropdowns */}
            <ProvincesCitiesSelect
              provinceValue={watch('province')}
              cityValue={watch('city')}
              onProvinceChange={(value) => setValue('province', value, { shouldValidate: true })}
              onCityChange={(value) => setValue('city', value, { shouldValidate: true })}
              provinceError={errors.province?.message}
              cityError={errors.city?.message}
            />

            {/* Address with Map */}
            <div className="col-span-2">
              <Label htmlFor="address">Alamat</Label>
              <LocationPicker
                value={watch('address')}
                onChange={(address) => setValue('address', address, { shouldValidate: true })}
                placeholder="Cari atau klik peta untuk lokasi..."
                province={watch('province')}
                city={watch('city')}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="postal_code">Kode Pos</Label>
              <Input
                id="postal_code"
                placeholder="Contoh: 12345"
                {...register('postal_code')}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                placeholder="Deskripsikan properti Anda..."
                {...register('description')}
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label>Foto Properti</Label>
              <UnitPhotoUpload
                photos={watch('images') || []}
                onPhotosChange={(photos) => setValue('images', photos)}
                maxPhotos={10}
              />
            </div>
            <div className="col-span-2">
              <Label>Fasilitas</Label>
              <CustomAmenities
                selectedAmenities={watch('amenities') || []}
                onAmenitiesChange={(amenities) => setValue('amenities', amenities)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {property ? 'Update Property' : 'Add Property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
