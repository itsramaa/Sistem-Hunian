import { useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Plus, X } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

const DEFAULT_AMENITIES = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'ac', label: 'AC' },
  { value: 'parking', label: 'Parkir' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'kitchen', label: 'Dapur Bersama' },
  { value: 'security', label: 'Keamanan 24 Jam' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'water_heater', label: 'Water Heater' },
  { value: 'gym', label: 'Gym' },
  { value: 'pool', label: 'Kolam Renang' },
  { value: 'furnished', label: 'Furnished' },
  { value: 'cleaning', label: 'Cleaning Service' },
];

interface CustomAmenitiesProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
}

export function CustomAmenities({ selectedAmenities, onAmenitiesChange }: CustomAmenitiesProps) {
  const [customInput, setCustomInput] = useState('');
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);

  // Extract custom amenities from selected that are not in default list
  const defaultValues = DEFAULT_AMENITIES.map(a => a.value);

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
    
    // Avoid duplicates
    if (selectedAmenities.includes(customValue)) {
      setCustomInput('');
      return;
    }

    // Add to custom list and select it
    if (!customAmenities.includes(customValue)) {
      setCustomAmenities([...customAmenities, customValue]);
    }
    onAmenitiesChange([...selectedAmenities, customValue]);
    setCustomInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomAmenity();
    }
  };

  const removeCustomAmenity = (value: string) => {
    setCustomAmenities(customAmenities.filter(a => a !== value));
    onAmenitiesChange(selectedAmenities.filter(a => a !== value));
  };

  // Get label for display (for custom amenities, format the value)
  const getLabel = (value: string): string => {
    const defaultItem = DEFAULT_AMENITIES.find(a => a.value === value);
    if (defaultItem) return defaultItem.label;
    // Format custom: replace underscores with spaces and capitalize
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-3">
      <Label>Fasilitas</Label>
      
      {/* Default amenities */}
      <div className="flex flex-wrap gap-2">
        {DEFAULT_AMENITIES.map((amenity) => (
          <Badge
            key={amenity.value}
            variant={selectedAmenities.includes(amenity.value) ? 'default' : 'outline'}
            className="cursor-pointer transition-colors"
            onClick={() => toggleAmenity(amenity.value)}
          >
            {amenity.label}
          </Badge>
        ))}
      </div>

      {/* Custom amenities */}
      {customAmenities.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {customAmenities.map((value) => (
            <Badge
              key={value}
              variant={selectedAmenities.includes(value) ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-colors gap-1",
                selectedAmenities.includes(value) && "pr-1"
              )}
              onClick={() => toggleAmenity(value)}
            >
              {getLabel(value)}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomAmenity(value);
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add custom */}
      <div className="flex gap-2 pt-2">
        <Input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tambah fasilitas kustom..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addCustomAmenity}
          disabled={!customInput.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Klik untuk memilih/batal, atau tambahkan fasilitas baru
      </p>
    </div>
  );
}
