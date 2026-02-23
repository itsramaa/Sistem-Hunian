import { useState, useEffect } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useCities, useProvinces } from '@/shared/hooks/useLocation';

interface ProvincesCitiesSelectProps {
  provinceValue: string;
  cityValue: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  provinceError?: string;
  cityError?: string;
}

export function ProvincesCitiesSelect({
  provinceValue,
  cityValue,
  onProvinceChange,
  onCityChange,
  provinceError,
  cityError,
}: ProvincesCitiesSelectProps) {
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  
  const { data: provinces = [], isLoading: loadingProvinces } = useProvinces();
  const { data: cities = [], isLoading: loadingCities } = useCities(selectedProvinceId);

  useEffect(() => {
    if (provinceValue && provinces.length > 0) {
      const province = provinces.find(p => p.name === provinceValue);
      if (province) {
        setSelectedProvinceId(province.id);
      }
    }
  }, [provinceValue, provinces]);

  const handleProvinceChange = (value: string) => {
    const province = provinces.find(p => p.id === value);
    if (province) {
      setSelectedProvinceId(value);
      onProvinceChange(province.name);
      onCityChange('');
    }
  };

  const handleCityChange = (value: string) => {
    const city = cities.find(c => c.id === value);
    if (city) {
      onCityChange(city.name);
    }
  };

  const currentCityId = cities.find(c => c.name === cityValue)?.id || '';

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="province">Provinsi</Label>
        <Select 
          value={selectedProvinceId} 
          onValueChange={handleProvinceChange}
          disabled={loadingProvinces}
        >
          <SelectTrigger className="rounded-xl bg-background/60 border-border/50">
            <SelectValue placeholder={loadingProvinces ? "Memuat..." : "Pilih provinsi"} />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {provinceError && (
          <p className="text-sm text-destructive">{provinceError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Kota/Kabupaten</Label>
        <Select 
          value={currentCityId} 
          onValueChange={handleCityChange}
          disabled={!selectedProvinceId || loadingCities}
        >
          <SelectTrigger className="rounded-xl bg-background/60 border-border/50">
            <SelectValue placeholder={
              loadingCities ? "Memuat..." : 
              !selectedProvinceId ? "Pilih provinsi dulu" : 
              "Pilih kota/kabupaten"
            } />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cityError && (
          <p className="text-sm text-destructive">{cityError}</p>
        )}
      </div>
    </>
  );
}
