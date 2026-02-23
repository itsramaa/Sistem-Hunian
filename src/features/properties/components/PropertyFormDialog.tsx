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
import { z } from "zod";
import { Property } from "../types";
import { PROPERTY_TYPES } from "../constants";
import { ProvincesCitiesSelect } from "./ProvincesCitiesSelect";
import { LocationPicker } from "./LocationPicker";
import { UnitPhotoUpload } from "./UnitPhotoUpload";
import { CustomAmenities } from "./CustomAmenities";
import { cn } from "@/shared/utils/utils";

// Schema for property form
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
  { label: 'Info Dasar', icon: Building2 },
  { label: 'Lokasi', icon: MapPin },
  { label: 'Media', icon: ImageIcon },
];

export function PropertyFormDialog({ open, onOpenChange, property, onSubmit, isLoading }: PropertyFormDialogProps) {
  const [step, setStep] = useState(0);
  const { register, handleSubmit, setValue, watch, reset, trigger, formState: { errors } } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: '', property_type: 'kost', address: '', city: '', province: '', postal_code: '', description: '', amenities: [], images: [] },
  });

  useEffect(() => {
    if (property) {
      reset({ name: property.name, property_type: property.property_type, address: property.address, city: property.city, province: property.province, postal_code: property.postal_code || '', description: property.description || '', amenities: property.amenities || [], images: property.images || [] });
    } else {
      reset({ name: '', property_type: 'kost', address: '', city: '', province: '', postal_code: '', description: '', amenities: [], images: [] });
    }
    setStep(0);
  }, [property, reset, open]);

  const handleNext = async () => {
    const fieldsPerStep: (keyof PropertyFormData)[][] = [['name', 'property_type'], ['address', 'province', 'city'], []];
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep(s => Math.min(s + 1, 2));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add New Property'}</DialogTitle>
          <DialogDescription>{property ? 'Update property details' : 'Add a new rental property to your portfolio'}</DialogDescription>
        </DialogHeader>

        {/* Connected Dots Stepper */}
        <div className="flex items-center justify-between px-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-300',
                i < step ? 'bg-success text-success-foreground shadow-sm' :
                i === step ? 'gradient-cta text-primary-foreground shadow-md' :
                'bg-muted text-muted-foreground'
              )}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-0.5 mx-1 rounded-full transition-colors', i < step ? 'bg-success' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(async (data) => await onSubmit(data))} className="space-y-4 mt-2 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto pr-1">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Properti *</Label>
                <Input id="name" placeholder="Contoh: Kost Harmoni" {...register('name')} className="rounded-xl bg-background/60 border-border/50" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label>Tipe Properti *</Label>
                <Select value={watch('property_type')} onValueChange={(value: any) => setValue('property_type', value, { shouldValidate: true })}>
                  <SelectTrigger className="rounded-xl bg-background/60"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deskripsi (Opsional)</Label>
                <Textarea placeholder="Deskripsikan properti Anda..." {...register('description')} rows={3} className="rounded-xl bg-background/60 border-border/50" />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <ProvincesCitiesSelect provinceValue={watch('province')} cityValue={watch('city')} onProvinceChange={(v) => setValue('province', v, { shouldValidate: true })} onCityChange={(v) => setValue('city', v, { shouldValidate: true })} provinceError={errors.province?.message} cityError={errors.city?.message} />
              <div>
                <Label>Alamat *</Label>
                <LocationPicker value={watch('address')} onChange={(a) => setValue('address', a, { shouldValidate: true })} placeholder="Cari atau klik peta untuk lokasi..." province={watch('province')} city={watch('city')} />
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <Label>Kode Pos</Label>
                <Input placeholder="Contoh: 12345" {...register('postal_code')} className="rounded-xl bg-background/60 border-border/50" />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div><Label>Foto Properti</Label><UnitPhotoUpload photos={watch('images') || []} onPhotosChange={(p) => setValue('images', p)} maxPhotos={10} /></div>
              <div><Label>Fasilitas</Label><CustomAmenities selectedAmenities={watch('amenities') || []} onAmenitiesChange={(a) => setValue('amenities', a)} /></div>
            </div>
          )}
        </form>

        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          {step > 0 && (<Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>)}
          {step < 2 ? (
            <Button type="button" onClick={handleNext} className="rounded-xl gradient-cta text-primary-foreground">Next<ArrowRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button onClick={handleSubmit(async (data) => await onSubmit(data))} disabled={isLoading} className="rounded-xl gradient-cta text-primary-foreground">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {property ? 'Update Property' : 'Add Property'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
