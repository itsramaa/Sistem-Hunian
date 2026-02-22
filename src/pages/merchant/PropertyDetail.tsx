import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePropertyDetail } from '@/features/properties/hooks/usePropertyDetail';
import { PropertyDetailSkeleton } from '@/features/properties/components/PropertyDetailSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Separator } from '@/shared/components/ui/separator';
import { 
  ArrowLeft, Building2, DoorOpen, Edit, Image as ImageIcon, MapPin, 
  Sparkles, TrendingUp, Users, DollarSign, Calendar, Hash, Clock
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/shared/components/ui/carousel';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
  available: 'bg-success/10 text-success border-success/30',
  occupied: 'bg-primary/10 text-primary border-primary/30',
  reserved: 'bg-warning/10 text-warning border-warning/30',
};

const typeLabels: Record<string, string> = {
  kost: 'Kost',
  apartment: 'Apartemen',
  house: 'Rumah',
  kontrakan: 'Kontrakan',
  ruko: 'Ruko',
};

function getOccupancyColor(rate: number): string {
  if (rate >= 80) return 'bg-success';
  if (rate >= 50) return 'bg-warning';
  return 'bg-destructive';
}

function isNewProperty(createdAt: string): boolean {
  const created = new Date(createdAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return created > sevenDaysAgo;
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading, error } = usePropertyDetail(id);
  const [unitFilter, setUnitFilter] = useState<string>('all');

  if (isLoading) return <PropertyDetailSkeleton />;

  if (error || !property) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Property not found</h3>
        <p className="text-sm text-muted-foreground mb-4">The property you're looking for doesn't exist or has been removed.</p>
        <Button asChild><Link to="/merchant/properties">Back to Properties</Link></Button>
      </div>
    );
  }

  const units = (property as any).units || [];
  const occupiedUnits = units.filter((u: any) => u.status === 'occupied').length;
  const totalUnits = units.length;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  const revenuePotential = units.filter((u: any) => u.status === 'occupied').reduce((sum: number, u: any) => sum + (u.rent_amount || 0), 0);
  const avgRent = totalUnits > 0 ? units.reduce((sum: number, u: any) => sum + (u.rent_amount || 0), 0) / totalUnits : 0;
  const isNew = isNewProperty(property.created_at);

  const filteredUnits = unitFilter === 'all' ? units : units.filter((u: any) => u.status === unitFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/merchant/properties')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-bold truncate">{property.name}</h1>
            {isNew && (
              <Badge className="bg-accent text-accent-foreground text-xs">
                <Sparkles className="h-3 w-3 mr-1" />Baru
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={statusColors[property.status]}>{property.status}</Badge>
            <Badge variant="secondary">{typeLabels[property.property_type] || property.property_type}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />{property.city}, {property.province}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate(`/merchant/properties`)}>
            <Edit className="h-4 w-4 mr-1" />Edit
          </Button>
          <Button variant="outline" size="sm">
            <ImageIcon className="h-4 w-4 mr-1" />Photos
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      {property.images && property.images.length > 0 ? (
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {property.images.map((img: string, i: number) => (
                <CarouselItem key={i} className="basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="h-48 rounded-lg overflow-hidden">
                    <img src={img} alt={`${property.name} - ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {property.images.length > 1 && (
              <>
                <CarouselPrevious className="-left-3" />
                <CarouselNext className="-right-3" />
              </>
            )}
          </Carousel>
          <Badge variant="secondary" className="absolute top-2 right-2">
            <ImageIcon className="h-3 w-3 mr-1" />{property.images.length} photos
          </Badge>
        </div>
      ) : (
        <div className="h-48 rounded-lg bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No photos yet</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DoorOpen className="h-4 w-4" />Total Units
            </div>
            <p className="text-2xl font-bold">{occupiedUnits}/{totalUnits}</p>
            <p className="text-xs text-muted-foreground">occupied / total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />Occupancy
            </div>
            <p className="text-2xl font-bold">{Math.round(occupancyRate)}%</p>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
              <div className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(occupancyRate)}`} style={{ width: `${occupancyRate}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />Revenue
            </div>
            <p className="text-2xl font-bold">{formatCurrency(revenuePotential)}</p>
            <p className="text-xs text-muted-foreground">from occupied units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />Avg Rent
            </div>
            <p className="text-2xl font-bold">{formatCurrency(avgRent)}</p>
            <p className="text-xs text-muted-foreground">per unit</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="units">Units ({totalUnits})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{property.address}</p>
                <p className="text-sm text-muted-foreground">{property.city}, {property.province} {property.postal_code}</p>
              </CardContent>
            </Card>
            {property.description && (
              <Card>
                <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{property.description}</p></CardContent>
              </Card>
            )}
            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Amenities</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a: string) => (
                      <Badge key={a} variant="secondary">
                        {a.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="units" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'available', 'occupied', 'maintenance', 'reserved'].map(s => (
                <Button key={s} variant={unitFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setUnitFilter(s)} className="capitalize">
                  {s === 'all' ? `All (${units.length})` : `${s} (${units.filter((u: any) => u.status === s).length})`}
                </Button>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Deposit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit: any) => (
                      <TableRow key={unit.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{unit.unit_number}</TableCell>
                        <TableCell className="capitalize">{unit.unit_type || '—'}</TableCell>
                        <TableCell>{unit.floor ?? '—'}</TableCell>
                        <TableCell>{unit.size_sqm ? `${unit.size_sqm} m²` : '—'}</TableCell>
                        <TableCell>{formatCurrency(unit.rent_amount || 0)}</TableCell>
                        <TableCell>{unit.deposit_amount ? formatCurrency(unit.deposit_amount) : '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[unit.status] || ''}>{unit.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUnits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No units found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-medium mb-1">Activity Log</h3>
                <p className="text-sm text-muted-foreground">Coming soon — track all changes and events for this property.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Property Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span className="truncate font-mono text-xs">{property.id}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created {format(new Date(property.created_at), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Updated {format(new Date(property.updated_at), 'dd MMM yyyy')}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Units</span><span className="font-medium">{totalUnits}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Occupied</span><span className="font-medium">{occupiedUnits}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-medium">{units.filter((u: any) => u.status === 'available').length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amenities</span><span className="font-medium">{property.amenities?.length || 0}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
