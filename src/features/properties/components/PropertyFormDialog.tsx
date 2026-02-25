import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Image as ImageIcon, Loader2, MapPin, Plus, User } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { z } from "zod";
import { Property } from "../types";
import { PROPERTY_TYPES, BUILDING_CONDITIONS, LAND_OWNERSHIP_OPTIONS } from "../constants";
import { ProvincesCitiesSelect } from "./ProvincesCitiesSelect";
import { LocationPicker } from "./LocationPicker";
import { UnitPhotoUpload } from "./UnitPhotoUpload";
import { CustomAmenities } from "./CustomAmenities";
import { GuardianFormDialog, GuardianFormData } from "./GuardianFormDialog";
import { useGuardians, useCreateGuardian } from "../hooks/useGuardians";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/shared/utils/utils";

const propertySchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100).transform(v => v.trim()),
  property_type: z.enum(['kost', 'kontrakan']),
  address: z.string().min(5, 'Alamat wajib diisi').max(255).transform(v => v.trim()),
  city: z.string().min(2, 'Kota wajib diisi').max(100),
  province: z.string().min(2, 'Provinsi wajib diisi').max(100),
  postal_code: z.string().max(10).optional(),
  description: z.string().max(1000).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  guardian_name: z.string().max(100).optional().nullable(),
  guardian_phone: z.string().max(20).optional().nullable(),
  marketing_cost: z.coerce.number().min(0).optional().nullable(),
  construction_year: z.coerce.number().min(1900, 'Tahun minimal 1900').max(2100, 'Tahun maksimal 2100').optional().nullable(),
  floor_count: z.coerce.number().int().min(1, 'Minimal 1 lantai').max(100, 'Maksimal 100 lantai').default(1),
  building_condition: z.string().optional().nullable(),
  land_ownership: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  isLoading: boolean;
  initialStep?: number;
}

const STEPS = [
  { label: 'Info Dasar', icon: Building2 },
  { label: 'Lokasi', icon: MapPin },
  { label: 'Detail', icon: User },
  { label: 'Media', icon: ImageIcon },
];

export function PropertyFormDialog({ open, onOpenChange, property, onSubmit, isLoading, initialStep = 0 }: PropertyFormDialogProps) {
  const [step, setStep] = useState(initialStep);
  const [showGuardianDialog, setShowGuardianDialog] = useState(false);
  const { merchant } = useAuth();
  
  const { data: guardians = [] } = useGuardians(merchant?.id);
  const createGuardian = useCreateGuardian();

  const { register, handleSubmit, setValue, watch, reset, trigger, formState: { errors } } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '', property_type: 'kost', address: '', city: '', province: '', postal_code: '',
      description: '', amenities: [], images: [],
      guardian_name: '', guardian_phone: '', marketing_cost: 0, construction_year: null,
      floor_count: 1, building_condition: 'baik', land_ownership: 'milik_sendiri',
      latitude: null, longitude: null,
    },
  });

  useEffect(() => {
    if (property) {
      reset({
        name: property.name, property_type: property.property_type, address: property.address,
        city: property.city, province: property.province, postal_code: property.postal_code || '',
        description: property.description || '', amenities: property.amenities || [], images: property.images || [],
        guardian_name: property.guardian_name || '', guardian_phone: property.guardian_phone || '',
        marketing_cost: property.marketing_cost || 0, construction_year: property.construction_year,
        floor_count: property.floor_count || 1, building_condition: property.building_condition || 'baik',
        land_ownership: property.land_ownership || 'milik_sendiri',
        latitude: property.latitude, longitude: property.longitude,
      });
    } else {
      reset({
        name: '', property_type: 'kost', address: '', city: '', province: '', postal_code: '',
        description: '', amenities: [], images: [],
        guardian_name: '', guardian_phone: '', marketing_cost: 0, construction_year: null,
        floor_count: 1, building_condition: 'baik', land_ownership: 'milik_sendiri',
        latitude: null, longitude: null,
      });
    }
    setStep(initialStep);
  }, [property, reset, open]);

  const handleNext = async () => {
    const fieldsPerStep: (keyof PropertyFormData)[][] = [
      ['name', 'property_type'],
      ['address', 'province', 'city'],
      ['floor_count'],
      [],
    ];
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSelectGuardian = (guardianId: string) => {
    const g = guardians.find((g: any) => g.id === guardianId);
    if (g) {
      setValue('guardian_name', g.name);
      setValue('guardian_phone', g.phone || '');
    }
  };

  const handleCreateGuardian = async (data: GuardianFormData) => {
    if (!merchant?.id) return;
    await createGuardian.mutateAsync({ ...data, merchant_id: merchant.id } as any);
    setShowGuardianDialog(false);
  };

  // Find selected guardian by matching name
  const selectedGuardianId = guardians.find((g: any) => g.name === watch('guardian_name'))?.id || '';

  const inputCls = "rounded-xl bg-background/60 border-border/50";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl overflow-x-hidden" aria-describedby="property-form-description">
          <DialogHeader>
            <DialogTitle>{property ? 'Edit Properti' : 'Tambah Properti Baru'}</DialogTitle>
            <DialogDescription id="property-form-description">{property ? 'Perbarui detail properti' : 'Tambahkan properti baru ke portofolio Anda'}</DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center justify-between px-2 overflow-x-auto flex-nowrap" role="navigation" aria-label="Langkah pendaftaran properti">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300',
                  i < step ? 'bg-success text-success-foreground shadow-sm' :
                  i === step ? 'gradient-cta text-primary-foreground shadow-md' :
                  'bg-muted text-muted-foreground'
                )} aria-current={i === step ? 'step' : undefined}>
                  {i < step ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
                {i < STEPS.length - 1 && (
                  <div className={cn('w-6 h-0.5 mx-0.5 rounded-full transition-colors', i < step ? 'bg-success' : 'bg-muted')} aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(async (data) => await onSubmit(data))} className="space-y-4 mt-2 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto pr-1">
            {/* Step 0: Info Dasar */}
            {step === 0 && (
              <div className="space-y-4" role="group" aria-labelledby="step-basic-info">
                <h3 id="step-basic-info" className="sr-only">Informasi Dasar</h3>
                <div>
                  <Label htmlFor="property-name">Nama Properti <span className="text-destructive">*</span></Label>
                  <Input id="property-name" placeholder="Contoh: Kost Harmoni" {...register('name')} className={cn(inputCls, errors.name && 'border-destructive')} />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="property-type-select">Tipe Properti <span className="text-destructive">*</span></Label>
                  <Select value={watch('property_type')} onValueChange={(v: any) => setValue('property_type', v, { shouldValidate: true })}>
                    <SelectTrigger id="property-type-select" className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="property-desc">Deskripsi (Opsional)</Label>
                  <Textarea id="property-desc" placeholder="Deskripsikan properti Anda..." {...register('description')} rows={3} className={inputCls} />
                </div>
              </div>
            )}

            {/* Step 1: Lokasi */}
            {step === 1 && (
              <div className="space-y-4" role="group" aria-labelledby="step-location">
                <h3 id="step-location" className="sr-only">Lokasi Properti</h3>
                <ProvincesCitiesSelect
                  provinceValue={watch('province')} cityValue={watch('city')}
                  onProvinceChange={(v) => setValue('province', v, { shouldValidate: true })}
                  onCityChange={(v) => setValue('city', v, { shouldValidate: true })}
                  provinceError={errors.province?.message} cityError={errors.city?.message}
                />
                <div>
                  <Label htmlFor="property-address">Alamat <span className="text-destructive">*</span></Label>
                  <LocationPicker
                    value={watch('address')}
                    onChange={(a, lat, lng) => {
                      setValue('address', a, { shouldValidate: true });
                      if (lat !== undefined) setValue('latitude', lat);
                      if (lng !== undefined) setValue('longitude', lng);
                    }}
                    placeholder="Cari atau klik peta untuk lokasi..."
                    province={watch('province')} city={watch('city')}
                  />
                  {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
                </div>
                <div>
                  <Label htmlFor="postal-code">Kode Pos</Label>
                  <Input id="postal-code" placeholder="Contoh: 12345" {...register('postal_code')} className={inputCls} />
                </div>
              </div>
            )}

            {/* Step 2: Detail Bangunan & Penjaga */}
            {step === 2 && (
              <div className="space-y-4" role="group" aria-labelledby="step-details">
                <h3 id="step-details" className="sr-only">Detail Bangunan</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="construction-year">Tahun Pembangunan</Label>
                    <Input id="construction-year" type="number" placeholder="2020" {...register('construction_year')} className={inputCls} />
                  </div>
                  <div>
                    <Label htmlFor="floor-count">Jumlah Lantai <span className="text-destructive">*</span></Label>
                    <Input id="floor-count" type="number" min={1} {...register('floor_count')} className={cn(inputCls, errors.floor_count && 'border-destructive')} />
                    {errors.floor_count && <p className="text-sm text-destructive mt-1">{errors.floor_count.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="building-condition">Kondisi Bangunan</Label>
                    <Select value={watch('building_condition') || 'baik'} onValueChange={(v) => setValue('building_condition', v)}>
                      <SelectTrigger id="building-condition" className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent>{BUILDING_CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="land-ownership">Status Kepemilikan</Label>
                    <Select value={watch('land_ownership') || 'milik_sendiri'} onValueChange={(v) => setValue('land_ownership', v)}>
                      <SelectTrigger id="land-ownership" className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent>{LAND_OWNERSHIP_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fasilitas */}
                <div className="border-t border-border/30 pt-4 mt-4">
                  <CustomAmenities selectedAmenities={watch('amenities') || []} onAmenitiesChange={(a) => setValue('amenities', a)} type="property" />
                </div>

                <div className="border-t border-border/30 pt-4 mt-4">
                  <p className="text-sm font-medium text-foreground mb-3">Info Penjaga (Opsional)</p>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="guardian-select">Pilih Penjaga</Label>
                      <Select value={selectedGuardianId} onValueChange={handleSelectGuardian}>
                        <SelectTrigger id="guardian-select" className={inputCls}>
                          <SelectValue placeholder="Pilih penjaga yang ada..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa Penjaga</SelectItem>
                          {guardians.map((g: any) => (
                            <SelectItem key={g.id} value={g.id}>
                              <div className="flex items-center gap-2">
                                {g.photo_url ? (
                                  <img src={g.photo_url} className="h-5 w-5 rounded-full object-cover" alt="" />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                                {g.name}
                                {g.phone && <span className="text-muted-foreground text-xs">• {g.phone}</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-10 w-10 shrink-0"
                      onClick={() => setShowGuardianDialog(true)}
                      title="Tambah penjaga baru"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Media */}
            {step === 3 && (
              <div className="space-y-4" role="group" aria-labelledby="step-media">
                <h3 id="step-media" className="sr-only">Media</h3>
                <div>
                  <Label>Foto Properti</Label>
                  <UnitPhotoUpload photos={watch('images') || []} onPhotosChange={(p) => setValue('images', p)} maxPhotos={10} />
                </div>
              </div>
            )}
          </form>

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl"><ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />Kembali</Button>}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext} className="rounded-xl gradient-cta text-primary-foreground">Lanjut<ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" /></Button>
            ) : (
              <Button onClick={handleSubmit(async (data) => await onSubmit(data))} disabled={isLoading} className="rounded-xl gradient-cta text-primary-foreground">
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
                {property ? 'Simpan Perubahan' : 'Tambah Properti'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guardian Form Dialog */}
      <GuardianFormDialog
        open={showGuardianDialog}
        onOpenChange={setShowGuardianDialog}
        properties={merchant?.id ? guardians.length >= 0 ? [{ id: '', name: '' }] : [] : []}
        onSubmit={handleCreateGuardian}
        isLoading={createGuardian.isPending}
        defaultPropertyId=""
      />
    </>
  );
}
