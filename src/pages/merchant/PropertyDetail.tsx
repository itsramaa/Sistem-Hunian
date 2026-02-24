import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePropertyDetail } from '@/features/properties/hooks/usePropertyDetail';
import { PropertyDetailSkeleton } from '@/features/properties/components/PropertyDetailSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Separator } from '@/shared/components/ui/separator';
import { Progress } from '@/shared/components/ui/progress';
import { 
  ArrowLeft, Building2, ChevronRight, DoorOpen, Edit, Image as ImageIcon, MapPin, 
  Sparkles, TrendingUp, Users, DollarSign, Calendar, Hash, Clock, Wrench, FileText, AlertTriangle,
  Shield, UserCheck
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/shared/components/ui/carousel';
import { Suspense, lazy, useState } from 'react';
import { ContentSkeleton } from '@/shared/components/ui/PageSkeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';

const LazyGuardians = lazy(() => import('@/pages/merchant/Guardians'));
const LazyCompliance = lazy(() => import('@/pages/merchant/PropertyCompliance'));
const LazyDataQuality = lazy(() => import('@/pages/merchant/DataQualityHistory'));
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { PropertyFinancialForm, FinancialFormData } from '@/features/properties/components/PropertyFinancialForm';
import { PropertyFinancialMetrics } from '@/features/properties/components/PropertyFinancialMetrics';
import { propertyService } from '@/features/properties/services/propertyService';
import { toast } from 'sonner';
import { useDssReadiness } from '@/features/dss/hooks/useDssReadiness';
import { DssReadinessCard } from '@/features/dss/components/DssReadinessCard';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
  available: 'bg-success/10 text-success border-success/30',
  occupied: 'bg-primary/10 text-primary border-primary/30',
  reserved: 'bg-warning/10 text-warning border-warning/30',
};

const typeLabels: Record<string, string> = { kost: 'Kost', kontrakan: 'Kontrakan / Ruko' };

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

  // Fetch contracts for this property's units
  const { data: propertyContracts = [] } = useQuery({
    queryKey: ['property-contracts', id],
    queryFn: async () => {
      if (!id) return [];
      const { data: units } = await supabase.from('units').select('id').eq('property_id', id);
      if (!units || units.length === 0) return [];
      const unitIds = units.map(u => u.id);
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, status, start_date, end_date, rent_amount, tenant_user_id, unit_id')
        .in('unit_id', unitIds)
        .order('created_at', { ascending: false });
      
      const tenantIds = [...new Set((contracts || []).map(c => c.tenant_user_id))];
      let profiles: Record<string, any> = {};
      if (tenantIds.length > 0) {
        const { data: profileData } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', tenantIds);
        (profileData || []).forEach(p => { profiles[p.user_id] = p; });
      }
      return (contracts || []).map(c => ({ ...c, tenant: profiles[c.tenant_user_id] }));
    },
    enabled: !!id,
  });

  // Fetch maintenance requests for this property's units
  const { data: propertyMaintenance = [] } = useQuery({
    queryKey: ['property-maintenance', id],
    queryFn: async () => {
      if (!id) return [];
      const { data: units } = await supabase.from('units').select('id, unit_number').eq('property_id', id);
      if (!units || units.length === 0) return [];
      const unitIds = units.map(u => u.id);
      const unitMap = Object.fromEntries(units.map(u => [u.id, u.unit_number]));
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('id, title, status, priority, created_at, unit_id')
        .in('unit_id', unitIds)
        .order('created_at', { ascending: false })
        .limit(10);
      return (requests || []).map(r => ({ ...r, unit_number: unitMap[r.unit_id] }));
    },
    enabled: !!id,
  });

  if (isLoading) return <PropertyDetailSkeleton />;

  if (error || !property) {
    return (
      <div className="text-center py-12">
        <div className="gradient-icon-box w-20 h-20 mx-auto mb-4"><Building2 className="h-10 w-10 text-muted-foreground" /></div>
        <h3 className="text-lg font-medium mb-2">Properti tidak ditemukan</h3>
        <p className="text-sm text-muted-foreground mb-4">Properti yang Anda cari tidak ada atau telah dihapus.</p>
        <Button asChild className="rounded-xl"><Link to="/merchant/properties">Kembali</Link></Button>
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
  const maintenanceUnits = units.filter((u: any) => u.status === 'maintenance').length;
  const activeContracts = propertyContracts.filter((c: any) => c.status === 'active');
  const pendingMaintenance = propertyMaintenance.filter((r: any) => r.status !== 'resolved' && r.status !== 'closed');

  return (
    <div className="space-y-6">


      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full bg-card/80 backdrop-blur-sm border border-border/40" onClick={() => navigate('/merchant/properties')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-bold truncate">{property.name}</h1>
            {isNew && <Badge className="bg-accent text-accent-foreground text-xs rounded-full"><Sparkles className="h-3 w-3 mr-1" />Baru</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={`rounded-full ${statusColors[property.status]}`}>{property.status}</Badge>
            <Badge variant="secondary" className="rounded-full">{typeLabels[property.property_type] || property.property_type}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{property.city}, {property.province}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl"><Edit className="h-4 w-4 mr-1" />Edit</Button>
          <Button variant="outline" size="sm" className="rounded-xl"><ImageIcon className="h-4 w-4 mr-1" />Foto</Button>
        </div>
      </div>

      {/* Image Gallery */}
      {property.images && property.images.length > 0 ? (
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {property.images.map((img: string, i: number) => (
                <CarouselItem key={i} className="basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="h-64 rounded-2xl overflow-hidden"><img src={img} alt={`${property.name} - ${i + 1}`} className="w-full h-full object-cover" loading="lazy" /></div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {property.images.length > 1 && <><CarouselPrevious className="-left-3" /><CarouselNext className="-right-3" /></>}
          </Carousel>
          <Badge variant="secondary" className="absolute top-3 right-3 rounded-full"><ImageIcon className="h-3 w-3 mr-1" />{property.images.length} foto</Badge>
        </div>
      ) : (
        <div className="h-48 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 flex items-center justify-center">
          <div className="text-center"><Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Belum ada foto</p></div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { icon: DoorOpen, iconColor: 'text-primary', label: 'Unit', value: `${occupiedUnits}/${totalUnits}`, sub: 'terisi / total' },
          { icon: TrendingUp, iconColor: 'text-info', label: 'Hunian', value: `${Math.round(occupancyRate)}%`, bar: true },
          { icon: DollarSign, iconColor: 'text-success', label: 'Pendapatan', value: formatCurrency(revenuePotential), sub: 'dari unit terisi' },
          { icon: Wrench, iconColor: 'text-warning', label: 'Maintenance', value: `${pendingMaintenance.length}`, sub: 'tiket aktif' },
          { icon: FileText, iconColor: 'text-accent-foreground', label: 'Kontrak', value: `${activeContracts.length}`, sub: 'kontrak aktif' },
        ].map((stat, i) => (
          <div key={i} className="glass-stat-card p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />{stat.label}
            </div>
            <p className="text-2xl font-bold font-display">{stat.value}</p>
            {stat.sub && <p className="text-xs text-muted-foreground">{stat.sub}</p>}
            {stat.bar && (
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 4 }, (_, j) => (
                  <div key={j} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${j < Math.round(occupancyRate / 25) ? getOccupancyColor(occupancyRate) : 'bg-muted/60'}`} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="pill-tab-list w-full sm:w-auto flex-wrap">
            <TabsTrigger value="overview" className="pill-tab-trigger">Overview</TabsTrigger>
            <TabsTrigger value="units" className="pill-tab-trigger">Unit ({totalUnits})</TabsTrigger>
            <TabsTrigger value="tenants" className="pill-tab-trigger">Tenant ({activeContracts.length})</TabsTrigger>
            <TabsTrigger value="financial" className="pill-tab-trigger">Keuangan</TabsTrigger>
            <TabsTrigger value="maintenance" className="pill-tab-trigger">
              Maintenance
              {pendingMaintenance.length > 0 && <Badge variant="secondary" className="ml-1.5 rounded-full text-xs">{pendingMaintenance.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="guardians" className="pill-tab-trigger">
              <UserCheck className="h-3.5 w-3.5 mr-1" />Staf
            </TabsTrigger>
            <TabsTrigger value="compliance" className="pill-tab-trigger">
              <Shield className="h-3.5 w-3.5 mr-1" />Kepatuhan
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4 animate-fade-in">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Alamat</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{property.address}</p>
                <p className="text-sm text-muted-foreground">{property.city}, {property.province} {property.postal_code}</p>
              </CardContent>
            </Card>
            {property.description && (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader><CardTitle className="text-base">Deskripsi</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{property.description}</p></CardContent>
              </Card>
            )}
            {property.amenities && property.amenities.length > 0 && (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader><CardTitle className="text-base">Fasilitas</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a: string) => (
                      <Badge key={a} variant="secondary" className="rounded-full">{a.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4 mt-4 animate-fade-in">
            <FinancialTabWithReadiness property={property} revenuePotential={revenuePotential} occupancyRate={occupancyRate} />
          </TabsContent>

          {/* Units Tab */}
          <TabsContent value="units" className="space-y-4 mt-4 animate-fade-in">
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'available', 'occupied', 'maintenance', 'reserved'].map(s => (
                <Button key={s} variant={unitFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setUnitFilter(s)} className={`capitalize rounded-full ${unitFilter === s ? 'gradient-cta text-primary-foreground' : ''}`}>
                  {s === 'all' ? `Semua (${units.length})` : `${s} (${units.filter((u: any) => u.status === s).length})`}
                </Button>
              ))}
            </div>
            <div className="glass-table">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Unit</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Tipe</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Lantai</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Ukuran</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Sewa</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Deposit</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.map((unit: any) => (
                    <TableRow key={unit.id} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => navigate(`/merchant/units/${unit.id}`)}>
                      <TableCell className="font-medium">{unit.unit_number}</TableCell>
                      <TableCell className="capitalize">{unit.unit_type || '—'}</TableCell>
                      <TableCell>{unit.floor ?? '—'}</TableCell>
                      <TableCell>{unit.size_sqm ? `${unit.size_sqm} m²` : '—'}</TableCell>
                      <TableCell>{formatCurrency(unit.rent_amount || 0)}</TableCell>
                      <TableCell>{unit.deposit_amount ? formatCurrency(unit.deposit_amount) : '—'}</TableCell>
                      <TableCell><Badge variant="outline" className={`rounded-full ${statusColors[unit.status] || ''}`}>{unit.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {filteredUnits.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Tidak ada unit ditemukan.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-3 mt-4 animate-fade-in">
            {activeContracts.length > 0 ? activeContracts.map((contract: any) => (
              <Card key={contract.id} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer" onClick={() => navigate(`/merchant/contracts/${contract.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-sm">
                        {(contract.tenant?.full_name || 'T')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{contract.tenant?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{contract.tenant?.email || '—'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={`rounded-full text-xs ${statusColors[contract.status] || ''}`}>{contract.status}</Badge>
                      <p className="text-sm font-medium mt-1">{formatCurrency(contract.rent_amount)}/bln</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(contract.start_date), 'dd MMM yyyy')} – {format(new Date(contract.end_date), 'dd MMM yyyy')}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="py-8 text-center">
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3"><Users className="h-6 w-6 text-muted-foreground/40" /></div>
                  <p className="text-sm text-muted-foreground">Belum ada tenant aktif di properti ini.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-3 mt-4 animate-fade-in">
            {propertyMaintenance.length > 0 ? propertyMaintenance.map((req: any) => (
              <Card key={req.id} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:border-primary/20 transition-all cursor-pointer" onClick={() => navigate(`/merchant/maintenance/${req.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-sm">{req.title}</span>
                        <p className="text-xs text-muted-foreground">Unit {req.unit_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize text-xs rounded-full">{req.priority}</Badge>
                      <Badge variant="outline" className="capitalize text-xs rounded-full">{req.status}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(req.created_at), 'dd MMM yyyy')}</p>
                </CardContent>
              </Card>
            )) : (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="py-8 text-center">
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3"><Wrench className="h-6 w-6 text-muted-foreground/40" /></div>
                  <p className="text-sm text-muted-foreground">Tidak ada permintaan maintenance.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Guardians Tab */}
          <TabsContent value="guardians" className="mt-4 animate-fade-in">
            <Suspense fallback={<ContentSkeleton />}>
              <LazyGuardians />
            </Suspense>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4 mt-4 animate-fade-in">
            <Suspense fallback={<ContentSkeleton />}>
              <LazyCompliance propertyId={id} />
            </Suspense>
            <Suspense fallback={<ContentSkeleton />}>
              <LazyDataQuality />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader><CardTitle className="text-base">Info Properti</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Hash className="h-3.5 w-3.5" /><span className="truncate font-mono text-xs">{property.id}</span></div>
              <Separator />
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /><span>Dibuat {format(new Date(property.created_at), 'dd MMM yyyy')}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /><span>Update {format(new Date(property.updated_at), 'dd MMM yyyy')}</span></div>
            </CardContent>
          </div>
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader><CardTitle className="text-base">Ringkasan</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Unit</span><span className="font-medium">{totalUnits}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Terisi</span><span className="font-medium text-success">{occupiedUnits}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tersedia</span><span className="font-medium">{units.filter((u: any) => u.status === 'available').length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Perbaikan</span><span className="font-medium text-warning">{maintenanceUnits}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Pendapatan</span><span className="font-medium text-success">{formatCurrency(revenuePotential)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Rata-rata Sewa</span><span className="font-medium">{formatCurrency(avgRent)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fasilitas</span><span className="font-medium">{property.amenities?.length || 0}</span></div>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialTabWithReadiness({ property, revenuePotential, occupancyRate }: { property: any; revenuePotential: number; occupancyRate: number }) {
  const readiness = useDssReadiness(property.id, property.merchant_id);

  return (
    <div className="space-y-4">
      <DssReadinessCard readiness={readiness} />
      <FinancialTabContent property={property} revenuePotential={revenuePotential} occupancyRate={occupancyRate / 100} />
    </div>
  );
}

function FinancialTabContent({ property, revenuePotential, occupancyRate }: { property: any; revenuePotential: number; occupancyRate: number }) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (data: FinancialFormData) => propertyService.updateProperty(property.id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-detail', property.id] });
      toast.success('Data keuangan berhasil disimpan');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <PropertyFinancialMetrics
        property={property}
        monthlyRevenue={revenuePotential}
        occupancyRate={occupancyRate}
      />
      <PropertyFinancialForm
        initialData={{
          construction_cost: property.construction_cost || 0,
          renovation_cost: property.renovation_cost || 0,
          funding_source: property.funding_source || 'modal_sendiri',
          monthly_amortization: property.monthly_amortization || 0,
          monthly_maintenance_cost: property.monthly_maintenance_cost || 0,
          avg_annual_unexpected_cost: property.avg_annual_unexpected_cost || 0,
        }}
        onSubmit={async (data) => { await updateMutation.mutateAsync(data); }}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
