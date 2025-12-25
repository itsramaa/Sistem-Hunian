import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
}

// Dynamic import for map components to avoid SSR issues
const LazyMap = ({ position, onLocationSelect, defaultCenter }: {
  position: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  defaultCenter: [number, number];
}) => {
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    useMapEvents: any;
    useMap: any;
  } | null>(null);
  const [L, setL] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadMap = async () => {
      try {
        const [leaflet, reactLeaflet] = await Promise.all([
          import('leaflet'),
          import('react-leaflet')
        ]);
        
        if (mounted) {
          setL(leaflet.default || leaflet);
          setMapComponents({
            MapContainer: reactLeaflet.MapContainer,
            TileLayer: reactLeaflet.TileLayer,
            Marker: reactLeaflet.Marker,
            useMapEvents: reactLeaflet.useMapEvents,
            useMap: reactLeaflet.useMap
          });
        }
      } catch (err) {
        console.error('Error loading map:', err);
        if (mounted) {
          setError('Gagal memuat peta. Silakan refresh halaman.');
        }
      }
    };
    
    loadMap();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="h-64 rounded-lg border bg-muted flex items-center justify-center text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!MapComponents || !L) {
    return (
      <div className="h-64 rounded-lg border bg-muted animate-pulse flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = MapComponents;

  // Fix for default marker icon
  const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const MapClickHandler = () => {
    useMapEvents({
      click: (e: any) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const MapCenterUpdater = ({ pos }: { pos: { lat: number; lng: number } | null }) => {
    const map = useMap();
    useEffect(() => {
      if (pos) {
        map.setView([pos.lat, pos.lng], 17);
      }
    }, [pos, map]);
    return null;
  };

  return (
    <MapContainer
      center={position ? [position.lat, position.lng] : defaultCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />
      <MapCenterUpdater pos={position} />
      {position && <Marker position={[position.lat, position.lng]} icon={defaultIcon} />}
    </MapContainer>
  );
};

export function LocationPicker({ value, onChange, placeholder = "Cari alamat..." }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Default center: Jakarta
  const defaultCenter: [number, number] = [-6.2088, 106.8456];

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setPosition({ lat, lng });
        onChange(result.display_name, lat, lng);
        setSearchQuery(result.display_name);
        setShowMap(true);
      }
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onChange]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        onChange(data.display_name, lat, lng);
        setSearchQuery(data.display_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onChange]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPosition({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

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
            className="pl-9"
          />
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleSearch}
          disabled={isSearching}
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
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
      
      {showMap && (
        <div className="h-64 rounded-lg overflow-hidden border">
          <LazyMap 
            position={position} 
            onLocationSelect={handleMapClick} 
            defaultCenter={defaultCenter}
          />
          <p className="text-xs text-muted-foreground mt-1 px-1">
            Klik pada peta untuk memilih lokasi, atau cari alamat di atas
          </p>
        </div>
      )}
    </div>
  );
}
