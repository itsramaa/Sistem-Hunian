import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, DoorOpen, ImageIcon, Loader2, Wallet, Zap, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { UnitPhotoUpload } from "./UnitPhotoUpload";
import { unitSchema, UnitFormData } from "../types/schema";
import { Unit, Property } from "../types";
import { getUnitTypesForProperty, MAX_REASONABLE_SIZE } from "../utils/unit-utils";
import { OCCUPANCY_TYPE_OPTIONS, COST_TYPE_OPTIONS, WIFI_SHARING_OPTIONS } from "../constants";
import { FacilityTypePicker } from "@/features/inventory/components/FacilityTypePicker";
import { cn } from "@/shared/utils/utils";

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit | null;
  properties: Property[];
  onSubmit: (data: UnitFormData) => Promise<void>;
  isLoading: boolean;
  preselectedPropertyId?: string;
}

const STEPS = [
  { label: 'Info Unit', icon: DoorOpen },
  { label: 'Harga & Detail', icon: Wallet },
  { label: 'Utilitas', icon: Zap },
  { label: 'Media', icon: ImageIcon },
];

export const UnitFormDialog = ({ open, onOpenChange, unit, properties, onSubmit, isLoading, preselectedPropertyId }: UnitFormDialogProps) => {
  const [step, setStep] = useState(0);
  const { register, handleSubmit, setValue, watch, reset, trigger, formState: { errors } } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      property_id: "", unit_number: "", unit_type: "", floor: null, size_sqm: null,
      rent_amount: 0, deposit_amount: null, status: "available", description: "", photos: [],
      occupancy_type: "single",
      electricity_included: false, electricity_cost: 0, electricity_cost_type: "flat",
      water_included: false, water_cost: 0, water_cost_type: "flat",
      wifi_included: false, wifi_speed_mbps: null, wifi_cost_sharing: "included", wifi_cost: 0,
      additional_costs: [],
    },
  });

  const selectedPropertyId = watch("property_id");
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const status = watch("status");
  const showFloor = (selectedProperty?.floor_count ?? 1) > 1;
  const electricityIncluded = watch("electricity_included");
  const waterIncluded = watch("water_included");
  const wifiIncluded = watch("wifi_included");

  useEffect(() => {
    if (selectedProperty && !unit) {
      const types = getUnitTypesForProperty(selectedProperty.property_type);
      if (types.length > 0) setValue("unit_type", types[0].value, { shouldValidate: true });
    }
  }, [selectedPropertyId, selectedProperty, unit, setValue]);

  useEffect(() => {
    if (unit) {
      reset({
        property_id: unit.property_id, unit_number: unit.unit_number, unit_type: unit.unit_type || "",
        floor: unit.floor, size_sqm: unit.size_sqm, rent_amount: unit.rent_amount,
        deposit_amount: unit.deposit_amount, status: unit.status as any, description: unit.description,
        photos: unit.photos || [],
        occupancy_type: unit.occupancy_type || "single",
        electricity_included: unit.electricity_included || false,
        electricity_cost: unit.electricity_cost || 0,
        electricity_cost_type: unit.electricity_cost_type || "flat",
        water_included: unit.water_included || false,
        water_cost: unit.water_cost || 0,
        water_cost_type: unit.water_cost_type || "flat",
        wifi_included: unit.wifi_included || false,
        wifi_speed_mbps: unit.wifi_speed_mbps || null,
        wifi_cost_sharing: unit.wifi_cost_sharing || "included",
        wifi_cost: unit.wifi_cost || 0,
        additional_costs: unit.additional_costs || [],
      });
    } else {
      const defaultPropertyId = preselectedPropertyId || (properties.length === 1 ? properties[0].id : "");
      reset({
        property_id: defaultPropertyId,
        unit_number: "", unit_type: "", floor: null, size_sqm: null,
        rent_amount: 0, deposit_amount: null, status: "available", description: "", photos: [],
        occupancy_type: "single",
        electricity_included: false, electricity_cost: 0, electricity_cost_type: "flat",
        water_included: false, water_cost: 0, water_cost_type: "flat",
        wifi_included: false, wifi_speed_mbps: null, wifi_cost_sharing: "included", wifi_cost: 0,
        additional_costs: [],
      });
    }
    setStep(0);
  }, [unit, reset, open, properties]);

  const handleNext = async () => {
    const fieldsPerStep: (keyof UnitFormData)[][] = [
      ['property_id', 'unit_number', 'unit_type'],
      ['rent_amount'],
      [],
      [],
    ];
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const inputCls = "rounded-xl bg-background/60 border-border/50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] rounded-2xl overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit Unit' : 'Tambah Unit Baru'}</DialogTitle>
          <DialogDescription>{unit ? 'Perbarui detail unit' : 'Tambahkan unit baru ke properti Anda'}</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between px-2 overflow-x-auto flex-nowrap">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn('flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300',
                i < step ? 'bg-success text-success-foreground shadow-sm' : i === step ? 'gradient-cta text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'
              )}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>
              <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={cn('w-6 h-0.5 mx-0.5 rounded-full transition-colors', i < step ? 'bg-success' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(async (d) => await onSubmit(d))} className="space-y-4 mt-2 max-h-[55vh] overflow-y-auto pr-1">
          {/* Step 0: Info Unit */}
          {step === 0 && (
            <div className="space-y-4">
              {properties.length > 1 && !preselectedPropertyId && (
                <div className="space-y-2">
                  <Label>Properti <span className="text-destructive">*</span></Label>
                  <Select value={watch("property_id")} onValueChange={(v) => setValue("property_id", v, { shouldValidate: true })}>
                    <SelectTrigger className={cn(inputCls, errors.property_id && 'border-destructive')}><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                    <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.property_id && <p className="text-sm text-destructive">{errors.property_id.message}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nomor Unit <span className="text-destructive">*</span></Label>
                  <Input {...register("unit_number")} placeholder="Contoh: A101" className={cn(inputCls, errors.unit_number && 'border-destructive')} />
                  {errors.unit_number && <p className="text-sm text-destructive">{errors.unit_number.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tipe Unit <span className="text-destructive">*</span></Label>
                  <Select value={watch("unit_type")} onValueChange={(v) => setValue("unit_type", v, { shouldValidate: true })}>
                    <SelectTrigger className={cn(inputCls, errors.unit_type && 'border-destructive')}><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                    <SelectContent>{getUnitTypesForProperty(selectedProperty?.property_type).map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.unit_type && <p className="text-sm text-destructive">{errors.unit_type.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipe Hunian</Label>
                  <Select value={watch("occupancy_type") || "single"} onValueChange={(v) => setValue("occupancy_type", v)}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>{OCCUPANCY_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={watch("status")} onValueChange={(v: any) => setValue("status", v, { shouldValidate: true })}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Tersedia</SelectItem>
                      <SelectItem value="occupied">Terisi</SelectItem>
                      <SelectItem value="maintenance">Perbaikan</SelectItem>
                      <SelectItem value="reserved">Dipesan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {status === 'occupied' && !unit && <p className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Set terisi manual. Pertimbangkan buat kontrak langsung.</p>}
            </div>
          )}

          {/* Step 1: Harga & Detail */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Harga Sewa / Bulan <span className="text-destructive">*</span></Label>
                  <Input type="number" min="0" {...register("rent_amount")} placeholder="1500000" className={cn(inputCls, errors.rent_amount && 'border-destructive')} />
                  {errors.rent_amount && <p className="text-sm text-destructive">{errors.rent_amount.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Deposit</Label>
                  <Input type="number" min="0" {...register("deposit_amount")} placeholder="500000" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {showFloor && (
                  <div className="space-y-2">
                    <Label>Lantai</Label>
                    <Input type="number" min="0" {...register("floor")} placeholder="Lantai ke-" className={inputCls} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Ukuran (m²)</Label>
                  <Input type="number" min="0" max={MAX_REASONABLE_SIZE} {...register("size_sqm")} placeholder="20" className={inputCls} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea {...register("description")} placeholder="Deskripsi unit..." rows={3} className={inputCls} />
              </div>
            </div>
          )}

          {/* Step 2: Utilitas */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Listrik */}
              <div className="rounded-xl border border-border/40 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Listrik Termasuk Sewa?</Label>
                  <Switch checked={electricityIncluded} onCheckedChange={(v) => setValue("electricity_included", v)} />
                </div>
                {!electricityIncluded && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Tipe Biaya</Label>
                      <Select value={watch("electricity_cost_type") || "flat"} onValueChange={(v) => setValue("electricity_cost_type", v)}>
                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                        <SelectContent>{COST_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {watch("electricity_cost_type") !== "bayar_sendiri" && (
                      <div>
                        <Label className="text-xs">Biaya Listrik (Rp)</Label>
                        <Input type="number" min="0" {...register("electricity_cost")} placeholder="0" className={inputCls} />
                      </div>
                    )}
                    {watch("electricity_cost_type") === "bayar_sendiri" && (
                      <p className="text-xs text-muted-foreground">Penyewa membayar langsung ke PLN</p>
                    )}
                  </div>
                )}
              </div>

              {/* Air */}
              <div className="rounded-xl border border-border/40 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Air Termasuk Sewa?</Label>
                  <Switch checked={waterIncluded} onCheckedChange={(v) => setValue("water_included", v)} />
                </div>
                {!waterIncluded && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Biaya Air (Rp)</Label>
                      <Input type="number" min="0" {...register("water_cost")} placeholder="0" className={inputCls} />
                    </div>
                    <div>
                      <Label className="text-xs">Tipe Biaya</Label>
                      <Select value={watch("water_cost_type") || "flat"} onValueChange={(v) => setValue("water_cost_type", v)}>
                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                        <SelectContent>{COST_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* WiFi */}
              <div className="rounded-xl border border-border/40 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">WiFi Tersedia?</Label>
                  <Switch checked={wifiIncluded} onCheckedChange={(v) => setValue("wifi_included", v)} />
                </div>
              {wifiIncluded && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Kecepatan (Mbps)</Label>
                        <Input type="number" min="0" {...register("wifi_speed_mbps")} placeholder="20" className={inputCls} />
                      </div>
                      <div>
                        <Label className="text-xs">Pembayaran WiFi</Label>
                        <Select value={watch("wifi_cost_sharing") || "included"} onValueChange={(v) => setValue("wifi_cost_sharing", v)}>
                          <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                          <SelectContent>{WIFI_SHARING_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    {watch("wifi_cost_sharing") === "patungan" && (
                      <div>
                        <Label className="text-xs">Biaya WiFi per Penghuni (Rp)</Label>
                        <Input type="number" min="0" {...register("wifi_cost")} placeholder="50000" className={inputCls} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fasilitas Kamar */}
              <div>
                <FacilityTypePicker
                  selectedTypeIds={watch("amenities") || []}
                  onSelectionChange={(a) => setValue("amenities", a)}
                  scope="unit"
                />
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Foto Unit</Label>
                <UnitPhotoUpload photos={watch("photos")} onPhotosChange={(p) => setValue("photos", p)} maxPhotos={10} />
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl"><ArrowLeft className="h-4 w-4 mr-1" />Kembali</Button>}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} className="rounded-xl gradient-cta text-primary-foreground">Lanjut<ArrowRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button onClick={handleSubmit(async (d) => await onSubmit(d))} disabled={isLoading} className="rounded-xl gradient-cta text-primary-foreground">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{unit ? 'Update Unit' : 'Tambah Unit'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
