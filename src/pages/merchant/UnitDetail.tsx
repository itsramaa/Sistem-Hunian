import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/shared/components/ui/carousel';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { 
  ArrowLeft, Building2, Calendar, ChevronRight, Clock, DoorOpen, Edit, 
  Hash, ImageIcon, MapPin, Ruler, Wallet, Wrench, Users, FileText
} from 'lucide-react';
import { cn } from '@/shared/utils/utils';

const statusColors: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/30',
  occupied: 'bg-primary/10 text-primary border-primary/30',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
  reserved: 'bg-info/10 text-info border-info/30',
};

const statusLabels: Record<string, string> = {
  available: 'Tersedia',
  occupied: 'Terisi',
  maintenance: 'Perbaikan',
  reserved: 'Dipesan',
};

function useUnitDetail(unitId: string | undefined) {
  return useQuery({
    queryKey: ['unit-detail', unitId],
    queryFn: async () => {
      if (!unitId) throw new Error('No unit ID');
      const { data, error } = await supabase
        .from('units')
        .select(`*, property:properties(id, name, address, city, province, property_type, merchant_id)`)
        .eq('id', unitId)
        .single();
      if (error) throw error;
      const { data: contracts } = await supabase
        .from('contracts')
        .select(`id, status, start_date, end_date, rent_amount, deposit_amount, tenant_user_id`)
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false });
      const tenantIds = [...new Set((contracts || []).map(c => c.tenant_user_id))];
      let tenantProfiles: Record<string, any> = {};
      if (tenantIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email, phone').in('user_id', tenantIds);
        (profiles || []).forEach(p => { tenantProfiles[p.user_id] = p; });
      }
      const { data: maintenanceRequests } = await supabase
        .from('maintenance_requests')
        .select('id, title, status, priority, created_at')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false })
        .limit(5);
      return { ...data, contracts: contracts || [], tenantProfiles, maintenanceRequests: maintenanceRequests || [] };
    },
    enabled: !!unitId,
  });
}

function UnitDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-2xl" />))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function UnitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: unit, isLoading, error } = useUnitDetail(id);

  if (isLoading) return <UnitDetailSkeleton />;

  if (error || !unit) {
    return (
      <div className="text-center py-12">
        <div className="gradient-icon-box w-20 h-20 mx-auto mb-4">
          <DoorOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Unit tidak ditemukan</h3>
        <p className="text-sm text-muted-foreground mb-4">Unit yang Anda cari tidak ada atau telah dihapus.</p>
        <Button asChild className="rounded-xl"><Link to="/merchant/units">Kembali ke Units</Link></Button>
      </div>
    );
  }

  const activeContract = unit.contracts?.find((c: any) => c.status === 'active');
  const activeTenant = activeContract ? unit.tenantProfiles?.[activeContract.tenant_user_id] : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 w-fit">
        <Link to="/merchant" className="hover:text-foreground transition-colors">Dashboard</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/merchant/units" className="hover:text-foreground transition-colors">Units</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-primary font-semibold">{unit.unit_number}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full bg-card/80 backdrop-blur-sm border border-border/40" onClick={() => navigate('/merchant/units')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">Unit {unit.unit_number}</h1>
            <Badge variant="outline" className={cn("capitalize rounded-full", statusColors[unit.status])}>
              {statusLabels[unit.status] || unit.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <Link to={`/merchant/properties/${unit.property?.id}`} className="hover:text-foreground hover:underline transition-colors">
                {unit.property?.name}
              </Link>
            </span>
            <span>•</span>
            <span className="capitalize">{unit.unit_type?.replace(/_/g, ' ') || '—'}</span>
            {unit.property?.city && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{unit.property.city}</span>
              </>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/merchant/units')}>
          <Edit className="h-4 w-4 mr-1" />Edit
        </Button>
      </div>

      {/* Photos */}
      {unit.photos && unit.photos.length > 0 ? (
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {unit.photos.map((img: string, i: number) => (
                <CarouselItem key={i} className="basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="h-56 rounded-2xl overflow-hidden">
                    <img src={img} alt={`Unit ${unit.unit_number} - ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {unit.photos.length > 1 && (
              <><CarouselPrevious className="-left-3" /><CarouselNext className="-right-3" /></>
            )}
          </Carousel>
          <Badge variant="secondary" className="absolute top-3 right-3 rounded-full">
            <ImageIcon className="h-3 w-3 mr-1" />{unit.photos.length} foto
          </Badge>
        </div>
      ) : (
        <div className="h-40 rounded-2xl bg-gradient-to-br from-primary/5 via-muted/50 to-accent/10 flex items-center justify-center">
          <div className="text-center">
            <DoorOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada foto</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Wallet, color: 'text-primary', label: 'Harga Sewa', value: formatCurrency(unit.rent_amount || 0), sub: 'per bulan' },
          { icon: Wallet, color: 'text-success', label: 'Deposit', value: unit.deposit_amount ? formatCurrency(unit.deposit_amount) : '—' },
          { icon: Ruler, color: 'text-info', label: 'Ukuran', value: unit.size_sqm ? `${unit.size_sqm} m²` : '—', sub: unit.floor != null ? `Lantai ${unit.floor}` : undefined },
          { icon: FileText, color: 'text-warning', label: 'Kontrak', value: `${unit.contracts?.length || 0}`, sub: activeContract ? 'aktif' : 'tidak aktif' },
        ].map((stat, i) => (
          <div key={i} className="glass-stat-card p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />{stat.label}
            </div>
            <p className="text-xl font-bold font-display">{stat.value}</p>
            {stat.sub && <p className="text-xs text-muted-foreground">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="pill-tab-list w-full sm:w-auto">
            <TabsTrigger value="overview" className="pill-tab-trigger">Overview</TabsTrigger>
            <TabsTrigger value="contracts" className="pill-tab-trigger">Kontrak ({unit.contracts?.length || 0})</TabsTrigger>
            <TabsTrigger value="maintenance" className="pill-tab-trigger">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4 animate-fade-in">
            {activeTenant && (
              <Card className="rounded-2xl border-l-4 border-l-success bg-card/90 backdrop-blur-sm border-border/40">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Penghuni Aktif</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold ring-2 ring-success/20">
                      {(activeTenant.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{activeTenant.full_name || 'Tidak diketahui'}</p>
                      <p className="text-sm text-muted-foreground">{activeTenant.email}</p>
                      {activeTenant.phone && <p className="text-sm text-muted-foreground">{activeTenant.phone}</p>}
                    </div>
                  </div>
                  {activeContract && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Kontrak: {format(new Date(activeContract.start_date), 'dd MMM yyyy')} – {format(new Date(activeContract.end_date), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {unit.description && (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader><CardTitle className="text-base">Deskripsi</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{unit.description}</p></CardContent>
              </Card>
            )}
            {unit.amenities && unit.amenities.length > 0 && (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader><CardTitle className="text-base">Fasilitas</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {unit.amenities.map((a: string) => (
                      <Badge key={a} variant="secondary" className="rounded-full">
                        {a.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {!activeTenant && !unit.description && (!unit.amenities || unit.amenities.length === 0) && (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="py-8 text-center">
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3">
                    <DoorOpen className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Unit kosong. Tidak ada informasi tambahan.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-3 mt-4 animate-fade-in">
            {unit.contracts?.length > 0 ? unit.contracts.map((contract: any) => {
              const tenant = unit.tenantProfiles?.[contract.tenant_user_id];
              return (
                <Card key={contract.id} className={cn("rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer", contract.status === 'active' && 'border-l-4 border-l-success shadow-[0_0_0_1px_hsl(var(--success)/0.2)]')} onClick={() => navigate(`/merchant/contracts/${contract.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("capitalize text-xs rounded-full", contract.status === 'active' ? 'bg-success/10 text-success' : '')}>{contract.status}</Badge>
                        <span className="text-sm font-medium">{tenant?.full_name || 'Unknown Tenant'}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(contract.rent_amount)}/bln</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{format(new Date(contract.start_date), 'dd MMM yyyy')} – {format(new Date(contract.end_date), 'dd MMM yyyy')}</span>
                      {contract.deposit_amount && <span>Deposit: {formatCurrency(contract.deposit_amount)}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="py-8 text-center">
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Belum ada kontrak untuk unit ini.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-3 mt-4 animate-fade-in">
            {unit.maintenanceRequests?.length > 0 ? unit.maintenanceRequests.map((req: any) => (
              <Card key={req.id} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:border-primary/20 transition-all cursor-pointer" onClick={() => navigate(`/merchant/maintenance/${req.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{req.title}</span>
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
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3">
                    <Wrench className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Tidak ada permintaan maintenance.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader><CardTitle className="text-base">Info Unit</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span className="truncate font-mono text-xs">{unit.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipe</span>
                <span className="font-medium capitalize">{unit.unit_type?.replace(/_/g, ' ') || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lantai</span>
                <span className="font-medium">{unit.floor ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ukuran</span>
                <span className="font-medium">{unit.size_sqm ? `${unit.size_sqm} m²` : '—'}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Dibuat {unit.created_at ? format(new Date(unit.created_at), 'dd MMM yyyy') : '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Update {unit.updated_at ? format(new Date(unit.updated_at), 'dd MMM yyyy') : '—'}</span>
              </div>
            </CardContent>
          </div>

          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader><CardTitle className="text-base">Properti</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <Link to={`/merchant/properties/${unit.property?.id}`} className="font-medium hover:underline text-primary">
                {unit.property?.name}
              </Link>
              <p className="text-muted-foreground mt-1 text-xs capitalize">{unit.property?.property_type}</p>
              {unit.property?.address && <p className="text-muted-foreground text-xs mt-1">{unit.property.address}</p>}
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
}
