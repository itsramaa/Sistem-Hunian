import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, DoorOpen, ImageIcon, Loader2, Wallet, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { UnitPhotoUpload } from "./UnitPhotoUpload";
import { unitSchema, UnitFormData } from "../types/schema";
import { Unit, Property } from "../types";
import { getUnitTypesForProperty, MAX_REASONABLE_SIZE } from "../utils/unit-utils";
import { cn } from "@/shared/utils/utils";

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit | null;
  properties: Property[];
  onSubmit: (data: UnitFormData) => Promise<void>;
  isLoading: boolean;
}

const STEPS = [
  { label: 'Info Unit', icon: DoorOpen },
  { label: 'Detail', icon: Wallet },
  { label: 'Media', icon: ImageIcon },
];

export const UnitFormDialog = ({ open, onOpenChange, unit, properties, onSubmit, isLoading }: UnitFormDialogProps) => {
  const [step, setStep] = useState(0);
  const { register, handleSubmit, setValue, watch, reset, trigger, formState: { errors } } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: { property_id: "", unit_number: "", unit_type: "", floor: null, size_sqm: null, rent_amount: 0, deposit_amount: null, status: "available", description: "", photos: [] },
  });

  const selectedPropertyId = watch("property_id");
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const status = watch("status");

  useEffect(() => {
    if (selectedProperty && !unit) {
      const types = getUnitTypesForProperty(selectedProperty.property_type);
      if (types.length > 0) setValue("unit_type", types[0].value, { shouldValidate: true });
    }
  }, [selectedPropertyId, selectedProperty, unit, setValue]);

  useEffect(() => {
    if (unit) {
      reset({ property_id: unit.property_id, unit_number: unit.unit_number, unit_type: unit.unit_type || "", floor: unit.floor, size_sqm: unit.size_sqm, rent_amount: unit.rent_amount, deposit_amount: unit.deposit_amount, status: unit.status as any, description: unit.description, photos: unit.photos || [] });
    } else {
      reset({ property_id: "", unit_number: "", unit_type: "", floor: null, size_sqm: null, rent_amount: 0, deposit_amount: null, status: "available", description: "", photos: [] });
    }
    setStep(0);
  }, [unit, reset, open]);

  const handleNext = async () => {
    const fieldsPerStep: (keyof UnitFormData)[][] = [['property_id', 'unit_number', 'unit_type'], ['rent_amount'], []];
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep(s => Math.min(s + 1, 2));
  };

  const inputCls = "rounded-xl bg-background/60 border-border/50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit Unit' : 'Tambah Unit Baru'}</DialogTitle>
          <DialogDescription>{unit ? 'Update detail unit' : 'Tambahkan unit baru ke properti Anda'}</DialogDescription>
        </DialogHeader>

        {/* Connected Dots Stepper */}
        <div className="flex items-center justify-between px-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn('flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-300',
                i < step ? 'bg-success text-success-foreground shadow-sm' : i === step ? 'gradient-cta text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'
              )}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>
              <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={cn('w-8 h-0.5 mx-1 rounded-full transition-colors', i < step ? 'bg-success' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(async (d) => await onSubmit(d))} className="space-y-4 mt-2 max-h-[55vh] overflow-y-auto pr-1">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Properti *</Label>
                <Select value={watch("property_id")} onValueChange={(v) => setValue("property_id", v, { shouldValidate: true })}>
                  <SelectTrigger className={cn(inputCls, errors.property_id && 'border-destructive')}><SelectValue placeholder="Pilih properti" /></SelectTrigger>
                  <SelectContent>{properties.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                </Select>
                {errors.property_id && <p className="text-sm text-destructive">{errors.property_id.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomor Unit *</Label>
                  <Input {...register("unit_number")} placeholder="Contoh: A101" className={cn(inputCls, errors.unit_number && 'border-destructive')} />
                  {errors.unit_number && <p className="text-sm text-destructive">{errors.unit_number.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tipe Unit *</Label>
                  <Select value={watch("unit_type")} onValueChange={(v) => setValue("unit_type", v, { shouldValidate: true })}>
                    <SelectTrigger className={cn(inputCls, errors.unit_type && 'border-destructive')}><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                    <SelectContent>{getUnitTypesForProperty(selectedProperty?.property_type).map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                  </Select>
                  {errors.unit_type && <p className="text-sm text-destructive">{errors.unit_type.message}</p>}
                </div>
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
                {status === 'occupied' && !unit && <p className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Set terisi manual. Pertimbangkan buat kontrak langsung.</p>}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Harga Sewa / Bulan *</Label><Input type="number" min="0" {...register("rent_amount")} placeholder="Contoh: 1500000" className={cn(inputCls, errors.rent_amount && 'border-destructive')} />{errors.rent_amount && <p className="text-sm text-destructive">{errors.rent_amount.message}</p>}</div>
                <div className="space-y-2"><Label>Deposit</Label><Input type="number" min="0" {...register("deposit_amount")} placeholder="Contoh: 500000" className={cn(inputCls, errors.deposit_amount && 'border-destructive')} />{errors.deposit_amount && <p className="text-sm text-destructive">{errors.deposit_amount.message}</p>}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Lantai</Label><Input type="number" min="0" {...register("floor")} placeholder="Lantai ke-" className={cn(inputCls, errors.floor && 'border-destructive')} />{errors.floor && <p className="text-sm text-destructive">{errors.floor.message}</p>}</div>
                <div className="space-y-2"><Label>Ukuran (m²)</Label><Input type="number" min="0" max={MAX_REASONABLE_SIZE} {...register("size_sqm")} placeholder="Contoh: 20" className={cn(inputCls, errors.size_sqm && 'border-destructive')} />{errors.size_sqm && <p className="text-sm text-destructive">{errors.size_sqm.message}</p>}</div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Deskripsi</Label><Textarea {...register("description")} placeholder="Deskripsi unit..." rows={3} className={inputCls} /></div>
              <div className="space-y-2"><Label>Foto Unit</Label><UnitPhotoUpload photos={watch("photos")} onPhotosChange={(p) => setValue("photos", p)} maxPhotos={10} /></div>
            </div>
          )}
        </form>

        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl"><ArrowLeft className="h-4 w-4 mr-1" />Kembali</Button>}
          {step < 2 ? (
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
