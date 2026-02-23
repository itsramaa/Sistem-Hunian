import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AlertCircle, Building2, Home, MapPin } from 'lucide-react';
import { useMerchantProperties } from '@/features/properties/hooks/useMerchantProperties';

interface MerchantPropertiesTabProps {
  merchantId: string;
}

export function MerchantPropertiesTab({ merchantId }: MerchantPropertiesTabProps) {
  const { properties, loading, error } = useMerchantProperties(merchantId);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-card/60 border border-border/30">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 rounded-2xl bg-gradient-to-br from-destructive/5 via-muted/50 to-muted/30">
        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-destructive/50" />
        <p className="text-destructive">Gagal memuat data properti</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl bg-gradient-to-br from-primary/5 via-muted/50 to-accent/5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center mx-auto mb-3">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No properties registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map((property) => (
        <div 
          key={property.id} 
          className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="gradient-icon-box">
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
            <Badge variant="outline" className="capitalize text-xs rounded-full">
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
              className={`text-xs rounded-full ${property.status === 'active' ? 'bg-success/10 text-success' : ''}`}
            >
              {property.status || 'active'}
            </Badge>
          </div>
        </div>
      ))}
      
      <div className="text-xs text-muted-foreground text-center pt-2 rounded-xl bg-muted/30 p-3">
        Total: {properties.length} properties, {properties.reduce((acc, p) => acc + (p.total_units || 0), 0)} units
      </div>
    </div>
  );
}
