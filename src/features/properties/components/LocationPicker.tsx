import { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Search, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationService } from '@/shared/services/locationService';

interface LocationPickerProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  province?: string;
  city?: string;
}

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function LocationPicker({ 
  value, 
  onChange, 
  placeholder = "Cari alamat...",
  province,
  city 
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const defaultCenter: [number, number] = [-6.2088, 106.8456];

  // Initialize map when showMap becomes true
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;
    
    // Don't reinitialize if map already exists
    if (mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(
      position ? [position.lat, position.lng] : defaultCenter,
      position ? 17 : 13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Add click handler
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      await handleReverseGeocode(lat, lng);
    });

    mapRef.current = map;

    // Add initial marker if position exists
    if (position) {
      markerRef.current = L.marker([position.lat, position.lng], { icon: defaultIcon }).addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMap]);

  // Update marker when position changes
  useEffect(() => {
    if (!mapRef.current || !position) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    markerRef.current = L.marker([position.lat, position.lng], { icon: defaultIcon }).addTo(mapRef.current);
    
    // Pan to new position
    mapRef.current.setView([position.lat, position.lng], 17);
  }, [position]);

  // Auto-center map when city/province changes
  useEffect(() => {
    if (!city && !province) return;

    const searchLocation = async () => {
      const query = city 
        ? `${city}, ${province || ''}, Indonesia`
        : `${province}, Indonesia`;
      
      try {
        const result = await locationService.searchAddress(query);
        
        if (result) {
          // Update map center without setting marker
          if (mapRef.current) {
            mapRef.current.setView([result.lat, result.lng], city ? 13 : 10);
          }
        }
      } catch (error) {
        console.error('Error searching city coordinates:', error);
      }
    };

    searchLocation();
  }, [city, province]);

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Build context-aware query
      let fullQuery = query;
      if (city || province) {
        const context = [city, province, 'Indonesia'].filter(Boolean).join(', ');
        fullQuery = `${query}, ${context}`;
      } else {
        fullQuery = `${query}, Indonesia`;
      }

      const result = await locationService.searchAddress(fullQuery);
      
      if (result) {
        setPosition({ lat: result.lat, lng: result.lng });
        onChange(result.display_name, result.lat, result.lng);
        setSearchQuery(result.display_name);
        setShowMap(true);
      }
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onChange, city, province]);

  const handleReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      const address = await locationService.reverseGeocode(lat, lng);
      
      if (address) {
        onChange(address, lat, lng);
        setSearchQuery(address);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onChange]);

  const handleSearch = () => {
    searchAddress(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="pl-9 rounded-xl bg-background/60 border-border/50"
          />
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleSearch}
          disabled={isSearching}
          className="rounded-xl"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowMap(!showMap)}
          className="rounded-xl"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
      
      {showMap && (
        <div className="space-y-1">
          <div 
            ref={mapContainerRef}
            className="h-64 rounded-2xl overflow-hidden border border-border/40 shadow-sm"
            style={{ zIndex: 0 }}
          />
          <p className="text-xs text-muted-foreground px-1">
            Klik pada peta untuk memilih lokasi, atau cari alamat di atas
          </p>
        </div>
      )}
    </div>
  );
}
