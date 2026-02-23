import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Image as ImageIcon, Loader2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { z } from "zod";
import { Property } from "../types";
import { PROPERTY_TYPES } from "../constants";
import { ProvincesCitiesSelect } from "./ProvincesCitiesSelect";
import { LocationPicker } from "./LocationPicker";
import { UnitPhotoUpload } from "./UnitPhotoUpload";
import { CustomAmenities } from "./CustomAmenities";
import { cn } from "@/shared/utils/utils";

const propertySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).transform(v => v.trim()),
  property_type: z.enum(['kost', 'kontrakan']),
  address: z.string().min(5, 'Address is required').max(255).transform(v => v.trim()),
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

const STEPS = [
  { label: 'Info Dasar', icon: Building2, description: 'Name & type' },
  { label: 'Lokasi', icon: MapPin, description: 'Address & location' },
  { label: 'Media', icon: ImageIcon, description: 'Photos & amenities' },
];

export function PropertyFormDialog({
  open,
  onOpenChange,
  property,
  onSubmit,
  isLoading
}: PropertyFormDialogProps) {
  const [step, setStep] = useState(0);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
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
    setStep(0);
  }, [property, reset, open]);

  const handleNext = async () => {
    const fieldsPerStep: (keyof PropertyFormData)[][] = [
      ['name', 'property_type'],
      ['address', 'province', 'city'],
      [],
    ];
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep(s => Math.min(s + 1, 2));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleFormSubmit = async (data: PropertyFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add New Property'}</DialogTitle>
          <DialogDescription>
            {property ? 'Update property details' : 'Add a new rental property to your portfolio'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors',
                i < step ? 'bg-success text-success-foreground' :
                i === step ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={cn('text-xs font-medium', i === step ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <Separator className={cn('w-8 mx-2', i < step ? 'bg-success' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto pr-1">
          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Properti *</Label>
                <Input id="name" placeholder="Contoh: Kost Harmoni" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="property_type">Tipe Properti *</Label>
                <Select
                  value={watch('property_type')}
                  onValueChange={(value: any) => setValue('property_type', value, { shouldValidate: true })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea id="description" placeholder="Deskripsikan properti Anda..." {...register('description')} rows={3} />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 1 && (
            <div className="space-y-4">
              <ProvincesCitiesSelect
                provinceValue={watch('province')}
                cityValue={watch('city')}
                onProvinceChange={(value) => setValue('province', value, { shouldValidate: true })}
                onCityChange={(value) => setValue('city', value, { shouldValidate: true })}
                provinceError={errors.province?.message}
                cityError={errors.city?.message}
              />
              <div>
                <Label htmlFor="address">Alamat *</Label>
                <LocationPicker
                  value={watch('address')}
                  onChange={(address) => setValue('address', address, { shouldValidate: true })}
                  placeholder="Cari atau klik peta untuk lokasi..."
                  province={watch('province')}
                  city={watch('city')}
                />
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <Label htmlFor="postal_code">Kode Pos</Label>
                <Input id="postal_code" placeholder="Contoh: 12345" {...register('postal_code')} />
              </div>
            </div>
          )}

          {/* Step 3: Media & Amenities */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Foto Properti</Label>
                <UnitPhotoUpload
                  photos={watch('images') || []}
                  onPhotosChange={(photos) => setValue('images', photos)}
                  maxPhotos={10}
                />
              </div>
              <div>
                <Label>Fasilitas</Label>
                <CustomAmenities
                  selectedAmenities={watch('amenities') || []}
                  onAmenitiesChange={(amenities) => setValue('amenities', amenities)}
                />
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />Back
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" onClick={handleNext}>
              Next<ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit(handleFormSubmit)} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {property ? 'Update Property' : 'Add Property'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
