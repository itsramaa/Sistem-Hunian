import { useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Plus, X, Settings2, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FacilityManagementDialog } from './FacilityManagementDialog';
import { formatCurrency } from '@/shared/utils/currency';

const PROPERTY_AMENITIES_FALLBACK = [
  { value: 'parking', label: 'Parkir' },
  { value: 'security', label: 'Keamanan 24 Jam' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'pool', label: 'Kolam Renang' },
  { value: 'gym', label: 'Gym' },
  { value: 'kitchen', label: 'Dapur Bersama' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'cleaning', label: 'Cleaning Service' },
];

const UNIT_AMENITIES_FALLBACK = [
  { value: 'ac', label: 'AC' },
  { value: 'water_heater', label: 'Water Heater' },
  { value: 'furnished', label: 'Furnished' },
  { value: 'lemari', label: 'Lemari' },
  { value: 'meja', label: 'Meja' },
  { value: 'kamar_mandi_dalam', label: 'Kamar Mandi Dalam' },
  { value: 'balkon', label: 'Balkon' },
];

interface CustomAmenitiesProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  type?: 'property' | 'unit';
}

export function CustomAmenities({ selectedAmenities, onAmenitiesChange, type = 'property' }: CustomAmenitiesProps) {
  const { merchant } = useAuth();
  const categoryFilter = type === 'property' ? 'umum' : 'unit';
  const sectionLabel = type === 'property' ? 'Fasilitas Umum' : 'Fasilitas Kamar';

  const [customInput, setCustomInput] = useState('');
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [showManageDialog, setShowManageDialog] = useState(false);

  // Fetch facilities from DB
  const { data: dbFacilities = [], isLoading } = useQuery({
    queryKey: ['facilities', merchant?.id, categoryFilter],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('facilities')
        .select('id, name, category, purchase_price')
        .eq('merchant_id', merchant!.id)
        .eq('category', categoryFilter)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Merge DB facilities with fallback defaults — always use name as value for consistency
  const FALLBACK = type === 'property' ? PROPERTY_AMENITIES_FALLBACK : UNIT_AMENITIES_FALLBACK;
  
  const dbItems = dbFacilities.map((f: any) => ({
    value: f.name.toLowerCase().replace(/\s+/g, '_'),
    label: f.name,
    price: f.purchase_price || 0,
  }));
  
  // Merge: show DB items + any fallback items not already covered by DB
  const dbValues = new Set(dbItems.map((d: any) => d.value));
  const fallbackExtras = FALLBACK
    .filter(f => !dbValues.has(f.value))
    .map(f => ({ ...f, price: 0 }));
  
  const facilityItems = [...dbItems, ...fallbackExtras];

  const toggleAmenity = (value: string) => {
    onAmenitiesChange(
      selectedAmenities.includes(value)
        ? selectedAmenities.filter(a => a !== value)
        : [...selectedAmenities, value]
    );
  };

  const addCustomAmenity = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const customValue = trimmed.toLowerCase().replace(/\s+/g, '_');
    if (selectedAmenities.includes(customValue)) { setCustomInput(''); return; }
    if (!customAmenities.includes(customValue)) setCustomAmenities([...customAmenities, customValue]);
    onAmenitiesChange([...selectedAmenities, customValue]);
    setCustomInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); }
  };

  const removeCustomAmenity = (value: string) => {
    setCustomAmenities(customAmenities.filter(a => a !== value));
    onAmenitiesChange(selectedAmenities.filter(a => a !== value));
  };

  const getLabel = (value: string): string => {
    const item = facilityItems.find(a => a.value === value);
    if (item) return item.label;
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{sectionLabel}</Label>
        {merchant?.id && (
          <Button type="button" variant="ghost" size="sm" className="rounded-xl gap-1 text-xs h-7" onClick={() => setShowManageDialog(true)}>
            <Settings2 className="h-3.5 w-3.5" /> Kelola
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat fasilitas...
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {facilityItems.map((amenity) => (
            <Badge
              key={amenity.value}
              variant={selectedAmenities.includes(amenity.value) ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-all duration-200 rounded-full px-3 py-1",
                selectedAmenities.includes(amenity.value)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/60 border-border/50 hover:border-primary/40 hover:bg-primary/5"
              )}
              onClick={() => toggleAmenity(amenity.value)}
            >
              {amenity.label}
              {amenity.price > 0 && (
                <span className="ml-1 text-[10px] opacity-70">{formatCurrency(amenity.price)}</span>
              )}
            </Badge>
          ))}
        </div>
      )}

      {customAmenities.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
          {customAmenities.map((value) => (
            <Badge
              key={value}
              variant={selectedAmenities.includes(value) ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-all duration-200 rounded-full px-3 py-1 gap-1",
                selectedAmenities.includes(value)
                  ? "bg-primary text-primary-foreground shadow-sm pr-1.5"
                  : "bg-background/60 border-border/50 hover:border-primary/40 hover:bg-primary/5"
              )}
              onClick={() => toggleAmenity(value)}
            >
              {getLabel(value)}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeCustomAmenity(value); }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tambah fasilitas kustom..."
          className="flex-1 rounded-xl bg-background/60 border-border/50"
        />
        <Button type="button" variant="outline" size="icon" onClick={addCustomAmenity} disabled={!customInput.trim()} className="rounded-xl">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Klik untuk memilih/batal, atau tambahkan fasilitas baru</p>

      {merchant?.id && (
        <FacilityManagementDialog
          open={showManageDialog}
          onOpenChange={setShowManageDialog}
          merchantId={merchant.id}
          categoryFilter={categoryFilter as 'umum' | 'unit'}
        />
      )}
    </div>
  );
}
