import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface Province {
  id: string;
  name: string;
}

interface City {
  id: string;
  province_id: string;
  name: string;
}

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
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data, error } = await supabase
          .from('provinces')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setProvinces(data || []);
      } catch (err) {
        console.error('Error fetching provinces:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Set initial province ID from value
  useEffect(() => {
    if (provinceValue && provinces.length > 0) {
      const province = provinces.find(p => p.name === provinceValue);
      if (province) {
        setSelectedProvinceId(province.id);
      }
    }
  }, [provinceValue, provinces]);

  // Fetch cities when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .eq('province_id', selectedProvinceId)
          .order('name');
        
        if (error) throw error;
        setCities(data || []);
      } catch (err) {
        console.error('Error fetching cities:', err);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [selectedProvinceId]);

  const handleProvinceChange = (value: string) => {
    const province = provinces.find(p => p.id === value);
    if (province) {
      setSelectedProvinceId(value);
      onProvinceChange(province.name);
      onCityChange(''); // Reset city when province changes
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
          <SelectTrigger>
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
          <SelectTrigger>
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
