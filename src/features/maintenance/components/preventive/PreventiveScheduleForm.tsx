import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = [
  { value: 'electrical', label: 'Listrik' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'AC/HVAC' },
  { value: 'cleaning', label: 'Kebersihan' },
  { value: 'general', label: 'Umum' },
];

const FREQUENCIES = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'quarterly', label: 'Per 3 Bulan' },
  { value: 'biannual', label: 'Per 6 Bulan' },
  { value: 'annual', label: 'Tahunan' },
  { value: 'custom', label: 'Custom' },
];

const PRIORITIES = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    merchantId: string;
    propertyId?: string;
    unitId?: string;
    title: string;
    description?: string;
    category: string;
    frequency: string;
    customIntervalDays?: number;
    preferredVendorId?: string;
    estimatedCost?: number;
    priority?: string;
    nextScheduledDate: string;
  }) => void;
  isSubmitting?: boolean;
}

export function PreventiveScheduleForm({ open, onOpenChange, onSubmit, isSubmitting }: Props) {
  const { merchant } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [frequency, setFrequency] = useState('monthly');
  const [customDays, setCustomDays] = useState(30);
  const [priority, setPriority] = useState('medium');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [propertyId, setPropertyId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: properties } = useQuery({
    queryKey: ['properties-select', merchant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, name')
        .eq('merchant_id', merchant!.id);
      return data || [];
    },
    enabled: !!merchant?.id,
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vendors')
        .select('id, business_name')
        .eq('verification_status', 'verified')
        .limit(50);
      return data || [];
    },
  });

  const handleSubmit = () => {
    if (!merchant?.id || !title || !startDate) return;
    onSubmit({
      merchantId: merchant.id,
      propertyId: propertyId || undefined,
      title,
      description: description || undefined,
      category,
      frequency,
      customIntervalDays: frequency === 'custom' ? customDays : undefined,
      preferredVendorId: vendorId || undefined,
      estimatedCost,
      priority,
      nextScheduledDate: startDate,
    });
    // Reset
    setTitle('');
    setDescription('');
    setCategory('general');
    setFrequency('monthly');
    setEstimatedCost(0);
    setPropertyId('');
    setVendorId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Jadwal Preventif</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Judul *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Servis AC, Pembersihan tangki..." />
          </div>

          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frekuensi</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === 'custom' && (
            <div className="space-y-2">
              <Label>Interval (hari)</Label>
              <Input type="number" value={customDays} onChange={e => setCustomDays(Number(e.target.value))} min={1} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Properti</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger><SelectValue placeholder="Semua properti" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua</SelectItem>
                {(properties || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Vendor Pilihan</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger><SelectValue placeholder="Belum ditentukan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Belum ditentukan</SelectItem>
                {(vendors || []).map((v: any) => <SelectItem key={v.id} value={v.id}>{v.business_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Estimasi Biaya (Rp)</Label>
              <Input type="number" value={estimatedCost} onChange={e => setEstimatedCost(Number(e.target.value))} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Prioritas</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Mulai *</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button className="flex-1" disabled={isSubmitting || !title || !startDate} onClick={handleSubmit}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
