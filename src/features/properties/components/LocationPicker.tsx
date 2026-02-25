import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Search, Loader2, Maximize2, Minimize2, X } from 'lucide-react';
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
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export function LocationPicker({ value, onChange, placeholder = "Cari alamat...", province, city }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSearch, setFullscreenSearch] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenMapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const defaultCenter: [number, number] = [-6.2088, 106.8456];

  const initMap = useCallback((container: HTMLElement) => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }

    const map = L.map(container).setView(
      position ? [position.lat, position.lng] : defaultCenter,
      position ? 17 : 13
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      await handleReverseGeocode(lat, lng);
    });

    mapRef.current = map;
    if (position) {
      markerRef.current = L.marker([position.lat, position.lng], { icon: defaultIcon }).addTo(map);
    }

    // Fix map size after render
    setTimeout(() => map.invalidateSize(), 100);
  }, [position]);

  // Init normal map
  useEffect(() => {
    if (!showMap || isFullscreen || !mapContainerRef.current) return;
    initMap(mapContainerRef.current);
    return () => { if (mapRef.current && !isFullscreen) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; } };
  }, [showMap, isFullscreen]);

  // Init fullscreen map
  useEffect(() => {
    if (!isFullscreen || !fullscreenMapRef.current) return;
    initMap(fullscreenMapRef.current);
    return () => { if (mapRef.current && isFullscreen) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; } };
  }, [isFullscreen]);

  // Update marker
  useEffect(() => {
    if (!mapRef.current || !position) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([position.lat, position.lng], { icon: defaultIcon }).addTo(mapRef.current);
    mapRef.current.setView([position.lat, position.lng], 17);
  }, [position]);

  // Auto-center on city change
  useEffect(() => {
    if (!city && !province) return;
    const searchLocation = async () => {
      const query = city ? `${city}, ${province || ''}, Indonesia` : `${province}, Indonesia`;
      try {
        const result = await locationService.searchAddress(query);
        if (result && mapRef.current) mapRef.current.setView([result.lat, result.lng], city ? 13 : 10);
      } catch (error) { console.error('Error searching city coordinates:', error); }
    };
    searchLocation();
  }, [city, province]);

  // ESC to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      let fullQuery = query;
      if (city || province) {
        fullQuery = `${query}, ${[city, province, 'Indonesia'].filter(Boolean).join(', ')}`;
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
    } catch (error) { console.error('Error searching address:', error); }
    finally { setIsSearching(false); }
  }, [onChange, city, province]);

  const handleReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      const address = await locationService.reverseGeocode(lat, lng);
      if (address) { onChange(address, lat, lng); setSearchQuery(address); }
    } catch (error) { console.error('Error reverse geocoding:', error); }
    finally { setIsSearching(false); }
  }, [onChange]);

  const fullscreenPortal = isFullscreen ? createPortal(
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      {/* Search bar overlay */}
      <div className="absolute top-0 left-0 right-0 z-[10000] p-3 bg-gradient-to-b from-background/90 to-transparent">
        <div className="flex gap-2 max-w-lg mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={fullscreenSearch}
              onChange={e => setFullscreenSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(fullscreenSearch); } }}
              placeholder="Cari alamat..."
              className="pl-9 rounded-xl bg-card/95 backdrop-blur-sm shadow-lg border-border/50"
              autoFocus
            />
          </div>
          <Button variant="outline" onClick={() => doSearch(fullscreenSearch)} disabled={isSearching} className="rounded-xl bg-card/95 shadow-lg">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsFullscreen(false)} className="rounded-xl bg-card/95 shadow-lg">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div ref={fullscreenMapRef} className="flex-1" />
    </div>,
    document.body
  ) : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(searchQuery); } }}
            placeholder={placeholder}
            className="pl-9 rounded-xl bg-background/60 border-border/50"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => doSearch(searchQuery)} disabled={isSearching} className="rounded-xl">
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="outline" onClick={() => setShowMap(!showMap)} className="rounded-xl">
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
      
      {showMap && !isFullscreen && (
        <div className="space-y-1 relative">
          <div ref={mapContainerRef} className="h-64 rounded-2xl overflow-hidden border border-border/40 shadow-sm" style={{ zIndex: 0 }} />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8 rounded-lg bg-card/90 backdrop-blur-sm shadow-md"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground px-1">Klik pada peta untuk memilih lokasi, atau cari alamat di atas</p>
        </div>
      )}

      {fullscreenPortal}
    </div>
  );
}
