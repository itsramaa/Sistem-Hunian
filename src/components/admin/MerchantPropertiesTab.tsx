import { useEffect, useState } from 'react';
import { Building2, Home, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  property_type: string;
  total_units: number | null;
  occupied_units: number | null;
  status: string | null;
}

interface MerchantPropertiesTabProps {
  merchantId: string;
}

export function MerchantPropertiesTab({ merchantId }: MerchantPropertiesTabProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, [merchantId]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, city, province, property_type, total_units, occupied_units, status')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-muted/50">
            <Skeleton className="h-5 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No properties registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map((property) => (
        <div key={property.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{property.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" />
                  <span>{property.address}, {property.city}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="capitalize text-xs">
              {property.property_type}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Units:</span>
              <span className="font-medium">{property.occupied_units || 0}/{property.total_units || 0}</span>
            </div>
            <Badge 
              variant="secondary" 
              className={`text-xs ${property.status === 'active' ? 'bg-success/10 text-success' : ''}`}
            >
              {property.status || 'active'}
            </Badge>
          </div>
        </div>
      ))}
      
      <div className="text-xs text-muted-foreground text-center pt-2">
        Total: {properties.length} properties, {properties.reduce((acc, p) => acc + (p.total_units || 0), 0)} units
      </div>
    </div>
  );
}
