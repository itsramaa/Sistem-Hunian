import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { addTenantSchema, AddTenantFormData } from '@/features/users/types/addTenantSchema';
import { useAllTenantsInSystem } from '@/features/users/hooks/useMerchantTenants';
import { Property } from '@/features/properties/types';
import { ArrowLeft, ArrowRight, Building2, Check, Home, Loader2, User, Users } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  onSubmit: (data: AddTenantFormData) => void;
  isLoading: boolean;
}

const STEPS = [
  { label: 'Pilih Tenant', icon: Users, description: 'Pilih dari daftar' },
  { label: 'Unit', icon: Home, description: 'Property & unit' },
  { label: 'Kontrak', icon: Building2, description: 'Tanggal & harga' },
];

export function AddTenantDialog({ open, onOpenChange, properties, onSubmit, isLoading }: AddTenantDialogProps) {
  const [step, setStep] = useState(0);
  const [selectedTenantUserId, setSelectedTenantUserId] = useState<string>('');
  const [searchTenant, setSearchTenant] = useState('');

  const { data: allTenants = [], isLoading: tenantsLoading } = useAllTenantsInSystem();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors }, trigger } = useForm<AddTenantFormData>({
    resolver: zodResolver(addTenantSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      property_id: '',
      unit_id: '',
      start_date: '',
      end_date: '',
      rent_amount: 0,
      deposit_amount: 0,
      billing_day: 1,
    },
  });

  const selectedPropertyId = watch('property_id');
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const availableUnits = (selectedProperty as any)?.units?.filter((u: any) => u.status === 'available') || [];

  const filteredTenants = allTenants.filter(t => {
    const q = searchTenant.toLowerCase();
    return (
      t.full_name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.phone?.toLowerCase().includes(q)
    );
  });

  const handleSelectTenant = (userId: string) => {
    setSelectedTenantUserId(userId);
    const tenant = allTenants.find(t => t.user_id === userId);
    if (tenant) {
      setValue('full_name', tenant.full_name || '', { shouldValidate: true });
      setValue('email', tenant.email || '', { shouldValidate: true });
      setValue('phone', tenant.phone || '');
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!selectedTenantUserId) return;
      setStep(1);
      return;
    }
    const fieldsPerStep: (keyof AddTenantFormData)[][] = [
      ['full_name', 'email'],
      ['property_id', 'unit_id'],
      ['start_date', 'end_date', 'rent_amount'],
    ];
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep(s => Math.min(s + 1, 2));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleFormSubmit = (data: AddTenantFormData) => {
    onSubmit({ ...data, tenant_user_id: selectedTenantUserId } as any);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setStep(0);
      setSelectedTenantUserId('');
      setSearchTenant('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle>Tambah Tenant</DialogTitle>
          <DialogDescription>Pilih tenant dari daftar dan buat kontrak langsung</DialogDescription>
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

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2">
          {/* Step 1: Pick Tenant */}
          {step === 0 && (
            <div className="space-y-3">
              <div>
                <Label>Cari Tenant</Label>
                <Input
                  placeholder="Ketik nama, email, atau telepon..."
                  value={searchTenant}
                  onChange={(e) => setSearchTenant(e.target.value)}
                />
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
                {tenantsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTenants.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Tidak ada tenant ditemukan
                  </div>
                ) : (
                  filteredTenants.map((tenant) => (
                    <button
                      type="button"
                      key={tenant.user_id}
                      onClick={() => handleSelectTenant(tenant.user_id)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-accent transition-colors',
                        selectedTenantUserId === tenant.user_id && 'bg-primary/10 border-l-2 border-l-primary'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                        selectedTenantUserId === tenant.user_id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        {selectedTenantUserId === tenant.user_id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          (tenant.full_name || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tenant.full_name || 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground truncate">{tenant.email}</p>
                      </div>
                      {tenant.phone && (
                        <span className="text-xs text-muted-foreground">{tenant.phone}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
              {!selectedTenantUserId && (
                <p className="text-sm text-muted-foreground">Pilih salah satu tenant untuk melanjutkan</p>
              )}
            </div>
          )}

          {/* Step 2: Unit Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50 flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{watch('full_name')}</p>
                  <p className="text-xs text-muted-foreground">{watch('email')}</p>
                </div>
              </div>
              <div>
                <Label>Property *</Label>
                <Select value={selectedPropertyId} onValueChange={(v) => { setValue('property_id', v, { shouldValidate: true }); setValue('unit_id', ''); }}>
                  <SelectTrigger><SelectValue placeholder="Pilih property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {p.name}
                          <Badge variant="secondary" className="text-[10px] ml-1">{p.property_type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.property_id && <p className="text-sm text-destructive mt-1">{errors.property_id.message}</p>}
              </div>
              <div>
                <Label>Unit Tersedia *</Label>
                <Select value={watch('unit_id')} onValueChange={(v) => {
                  setValue('unit_id', v, { shouldValidate: true });
                  const unit = availableUnits.find((u: any) => u.id === v);
                  if (unit) {
                    setValue('rent_amount', unit.rent_amount || 0);
                    setValue('deposit_amount', unit.deposit_amount || 0);
                  }
                }} disabled={!selectedPropertyId}>
                  <SelectTrigger><SelectValue placeholder={selectedPropertyId ? "Pilih unit" : "Pilih property dulu"} /></SelectTrigger>
                  <SelectContent>
                    {availableUnits.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Tidak ada unit tersedia</div>
                    ) : (
                      availableUnits.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center gap-2">
                            Unit {u.unit_number}
                            {u.rent_amount > 0 && <span className="text-muted-foreground text-xs">• Rp {u.rent_amount.toLocaleString()}</span>}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.unit_id && <p className="text-sm text-destructive mt-1">{errors.unit_id.message}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Contract Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Tanggal Mulai *</Label>
                  <Input id="start_date" type="date" {...register('start_date')} />
                  {errors.start_date && <p className="text-sm text-destructive mt-1">{errors.start_date.message}</p>}
                </div>
                <div>
                  <Label htmlFor="end_date">Tanggal Selesai *</Label>
                  <Input id="end_date" type="date" {...register('end_date')} />
                  {errors.end_date && <p className="text-sm text-destructive mt-1">{errors.end_date.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="rent_amount">Sewa Bulanan (Rp) *</Label>
                <Input id="rent_amount" type="number" {...register('rent_amount', { valueAsNumber: true })} />
                {errors.rent_amount && <p className="text-sm text-destructive mt-1">{errors.rent_amount.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit_amount">Deposit (Rp)</Label>
                  <Input id="deposit_amount" type="number" {...register('deposit_amount', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="billing_day">Hari Tagihan (1-28)</Label>
                  <Input id="billing_day" type="number" min={1} max={28} {...register('billing_day', { valueAsNumber: true })} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />Kembali
              </Button>
            )}
            {step < 2 ? (
              <Button type="button" onClick={handleNext} disabled={step === 0 && !selectedTenantUserId}>
                Lanjut<ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Tambah Tenant
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
